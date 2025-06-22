package com.ffb.chess

import cats.effect.IO
import cats.effect.IO.asyncForIO
import com.comcast.ip4s.{Host, Port}
import org.http4s.ember.server.EmberServerBuilder
import org.http4s.HttpRoutes
import org.http4s.implicits.*
import org.http4s.server.Router

import com.ffb.chess.routes.ChessRoutes
import com.ffb.chess.repository.ChessGameRepository

object Server {

  def runServer: IO[Unit] =
    for {
      repo <- ChessGameRepository.create[IO]
      routes = Router(
        "/api/chess/game" -> ChessRoutes.routes(repo)
      ).orNotFound
      _ <- EmberServerBuilder
        .default[IO]
        .withHost(Host.fromString("localhost").get)
        .withPort(Port.fromInt(8080).get)
        .withHttpApp(routes)
        .build
        .use(_ => IO.never) // Keep the server running
    } yield ()
}
