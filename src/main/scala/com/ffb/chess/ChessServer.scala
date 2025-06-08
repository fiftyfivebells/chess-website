package com.ffb.chess

import cats.effect.IO
import com.comcast.ip4s.{Host, Port}
import org.http4s.ember.server.EmberServerBuilder
import org.http4s.HttpRoutes
import org.http4s.implicits._
import org.http4s.server.Router

import com.ffb.chess.routes.ChessRoutes

object Server {
  def routes: HttpRoutes[IO] = Router(
    "/api/chess/game" -> ChessRoutes.routes()
  )

  def runServer(): IO[Unit] = {
    EmberServerBuilder
      .default[IO]
      .withHost(Host.fromString("localhost").get)
      .withPort(Port.fromInt(8080).get)
      .withHttpApp(routes.orNotFound)
      .build
      .use(_ => IO.never) // Keep the server running
  }
}
