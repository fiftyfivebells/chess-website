package com.ffb.chess

import cats.effect.{ExitCode, IO, IOApp}

object Main extends IOApp {
  def run(args: List[String]): IO[ExitCode] = {
      println("Starting the server...")
      Server.runServer().as(ExitCode.Success)
  }
}
