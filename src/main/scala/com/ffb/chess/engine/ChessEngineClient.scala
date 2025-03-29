package com.ffb.chess.engine

import cats.effect.{IO, Resource}
import java.io.{BufferedReader, InputStreamReader}
import com.ffb.chess.domain.Move

case class ChessEngineClient(
    val process: os.SubProcess,
    val reader: BufferedReader
) {
  // TODO: look into fs2 and consider replacing this implementation with one that uses streams
  private def runCommand(
      cmd: UciCommand,
      terminator: String = "uciok"
  ): IO[String] = IO.blocking {
    // send the command
    process.stdin.writeLine(cmd.command)
    process.stdin.flush()

    // this recursive helper reads the input from stdout up to and including a terminating line.
    // the uci spec has pretty specific prefixes for output, like "uciok", "bestmove", etc.
    // this lets the server read all the output and then stop blocking, so other things can happen
    @tailrec
    def readLines(lines: List[String]): List[String] = {
      reader.readLine() match {
        case null                                => lines.reverse
        case line if line.startsWith(terminator) => (line :: lines).reverse
        case line                                => readLines(line :: lines)
      }
    }

    val output = readLines(Nil)

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
