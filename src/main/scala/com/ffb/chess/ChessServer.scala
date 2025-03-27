package com.ffb.chess

// Server.scala
import org.http4s.HttpRoutes
import org.http4s.ember.server.EmberServerBuilder
import org.http4s.implicits._
import cats.effect.IO

import _root_.com.comcast.ip4s.{Host, Port}
import _root_.com.ffb.chess.routes.ChessRoutes

object Server {
  def routes(): HttpRoutes[IO] =
    ChessRoutes.routes()

  def runServer(): IO[Unit] = {
    EmberServerBuilder
      .default[IO]
      .withHost(Host.fromString("localhost").get)
      .withPort(Port.fromInt(8080).get)
      .withHttpApp(routes().orNotFound)
      .build
      .use(_ => IO.never) // Keep the server running
  }
}
