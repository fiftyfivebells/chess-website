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

  private def initializeEngine(
      fen: Option[String],
      moves: Option[Seq[Move]]
  ): IO[Unit] =
    for {
      _ <- runCommand(Uci)
      _ <- runCommand(UciNewGame)
      moveInput = moves match {
        case None    => ""
        case Some(m) => transformMovesInput(m)
      }
      _ <- runCommand(Position(fen, moveInput))
    } yield ()

  def bestMove(fen: Option[String], moves: Option[Seq[Move]]): IO[Move] =
    for {
      _ <- initializeEngine(fen, moves)
      output <- runCommand(Go(), "bestmove")
      move = output.dropWhile(_ != ' ').trim
    } yield Move.fromString(move)

  /** Transforms a Seq of moves into a space-delimited string of move strings
    *
    * The chess engine takes moves as a string separated by spaces, as in this
    * command: position fen <fen> e2e4 d7d5 .. .. ..
    *
    * This function takes the Seq of moves and makes a compatible string
    */
  private def transformMovesInput(input: Seq[Move]): String = {
    val moves = input.map(_.toString()).mkString(" ")

    s"moves $moves"
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
