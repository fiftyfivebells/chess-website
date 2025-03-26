package com.ffb.chess.routes

import org.http4s.HttpRoutes
import org.http4s.dsl.Http4sDsl
import org.http4s.circe._
import io.circe.generic.auto._
import cats.effect.IO
import com.ffb.chess.service.ChessService
import com.ffb.chess.service.BestMove
import org.http4s.EntityEncoder

object ChessRoutes extends Http4sDsl[IO] {
  implicit val bestMoveEncoder: EntityEncoder[IO, BestMove] =
    jsonEncoderOf[IO, BestMove]

  val routes: HttpRoutes[IO] = HttpRoutes.of[IO] {
    case GET -> Root / "api" / "chess" / "bestmove" =>
      Ok(ChessService.bestMove())
  }
}
