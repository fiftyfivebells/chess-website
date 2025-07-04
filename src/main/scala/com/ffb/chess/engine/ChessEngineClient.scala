package com.ffb.chess.engine

import cats.effect.{IO, Resource}
import cats.effect.kernel.Async
import cats.effect.kernel.Async.*
import cats.effect.std.Queue
import cats.implicits.*
import fs2.Stream
import java.io.{BufferedReader, BufferedWriter, InputStreamReader, OutputStreamWriter}

import com.ffb.zugzwang.move.Move

class ChessEngineClient[F[_]: Async] private (
  queue: Queue[F, String],
  writer: BufferedWriter,
  process: Process
):
  private def runCommand(
    cmd: UciCommand,
    terminator: String = "uciok"
  ): F[String] =
    for
      _ <- Async[F].blocking {
             writer.write(cmd.command)
             writer.newLine()
             writer.flush()
           }
      lines <- Stream
                 .repeatEval(queue.take)
                 .takeThrough(_.startsWith(terminator))
                 .compile
                 .toList

      out = lines.mkString("\n")
    yield out

  private def initializeEngine(
    fen: Option[String],
    moves: Option[Seq[Move]]
  ): F[Unit] =
    for
      _ <- runCommand(Uci)
      _ <- runCommand(UciNewGame)
      _ <- runCommand(Position(fen, moves.map(transformMovesInput(_))))
    yield ()

  def bestMove(fen: Option[String], moves: Option[Seq[Move]]): F[String] =
    for
      _      <- initializeEngine(fen, moves)
      output <- runCommand(Go(), "bestmove")
      move    = output.dropWhile(_ != ' ').trim
    yield move

  /**
   * Transforms a Seq of moves into a space-delimited string of move strings
   *
   * The chess engine takes moves as a string separated by spaces, as in this
   * command: position fen <fen> e2e4 d7d5 .. .. ..
   *
   * This function takes the Seq of moves and makes a compatible string
   */
  private def transformMovesInput(input: Seq[Move]): String =
    val moves = input.map(_.toString()).mkString(" ")

    s"moves $moves"

object ChessEngineClient:
  def create[F[_], Async](engine: ChessEngine): Resource[F, ChessEngineClient[F]] =
    for
      process <- Resource.make(
                   Async[F].delay(new fs2.io.process.ProcessBuilder(engine.engineName).start())
                 )(p => Async[F].blocking(p.destroy()))
      reader = new BufferedReader(new InputStreamReader(process.getInputStream))
      writer = new BufferedWriter(new OutputStreamWriter(process.getOutputStream))

      queue <- Resource.eval(Queue.unbounded[F, String])
      fiber <- Resource.make {
                 Stream
                   .repeatEval(Async[F].blocking(reader.readLine()))
                   .takeWhile(_ != null)
                   .evalMap(line => queue.offer(line))
                   .compile
                   .drain
                   .start
               }(_.cancel)
    yield ChessEngineClient(queue, process, reader)
