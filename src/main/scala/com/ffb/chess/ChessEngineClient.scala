package com.ffb.chess

import cats.effect.{IO, Resource}
import java.io.{BufferedReader, InputStreamReader}

case class ChessEngineClient(
    val process: os.SubProcess,
    val reader: BufferedReader
) {
  def runCommand(cmd: String): IO[String] = IO.blocking {
    val _ = IO.blocking(new java.io.File(".").getCanonicalPath).debug()

    process.stdin.writeLine(cmd)
    process.stdin.flush()

    val linesIterator =
      Iterator.continually(Option(reader.readLine())) takeWhile {
        // all the uci commands end with a "uciok", so this is how we know to stop reading
        case Some(line) if line.startsWith("uciok") => false
        case Some(_)                                => true
        case None                                   => false
      }

    val output = linesIterator.flatten.toList

    output.mkString("\n").trim
  }
}

object ChessEngineClient {
  def create(engineName: String): Resource[IO, ChessEngineClient] =
    for {
      process <- Resource.make(
        IO.blocking {
          os.proc(engineName).spawn()
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
