package com.ffb.chess.engine

import cats.effect.{IO, Resource}
import java.io.{BufferedReader, InputStreamReader}
import com.ffb.chess.domain.Move

case class ChessEngineClient(
    val process: os.SubProcess,
    val reader: BufferedReader
) {
  private def runCommand(
      cmd: UciCommand,
      terminator: String = "uciok"
  ): IO[String] = IO.blocking {
    process.stdin.writeLine(cmd.command)
    process.stdin.flush()

    val linesIterator =
      Iterator.continually(Option(reader.readLine())) takeWhile {
        // all the uci commands end with a "uciok", so this is how we know to stop reading
        case Some(line) if line.startsWith(terminator) => false
        case Some(_)                                   => true
        case None                                      => false
      }

    val output = linesIterator.flatten.toList

    output.mkString("\n").trim
  }

  private def initializeEngine(fen: Option[String]): IO[Unit] =
    for {
      _ <- runCommand(Uci)
      _ <- runCommand(UciNewGame)
      _ <- runCommand(Position(fen))
    } yield ()

  def bestMove(fen: Option[String]): IO[Move] =
    for {
      _ <- initializeEngine(fen)
      output <- runCommand(Go())
      move = output.dropWhile(_ != ' ').trim
    } yield Move.fromString(move)

  def allMoves(fen: Option[String]): IO[Seq[Move]] =
    for {
      _ <- initializeEngine(fen)
      output <- runCommand(Go("allmoves"))
    } yield transformAllMovesOutput(output)

  /** Transforms the output from the engine when given the command "go allmoves"
    *
    * The engine's "go allmoves" command will always return output of the
    * following shape: allmoves [.. .. .. ..] where the .. represents a move.
    *
    * This private method takes in that output and converts it into a sequence
    * of Move objects to be returned by the allMoves method.
    */
  private def transformAllMovesOutput(output: String): Seq[Move] = {
    val moves = output.dropWhile(_ != '[').trim

    Move.fromListString(moves)
  }
}

object ChessEngineClient {
  def create(engine: ChessEngine): Resource[IO, ChessEngineClient] =
    for {
      process <- Resource.make(
        IO.blocking {
          os.proc(engine.engineName).spawn()
        }
      )(p =>
        IO {
          p.stdin.close()
          p.stdout.close()
          p.stderr.close()
          p.destroy()
        }
      )
      reader <- Resource.eval(
        IO.blocking {
          new BufferedReader(new InputStreamReader(process.stdout))
        }
      )
    } yield ChessEngineClient(process, reader)
}
