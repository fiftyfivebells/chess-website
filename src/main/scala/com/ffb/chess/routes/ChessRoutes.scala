package com.ffb.chess.routes

import org.http4s.{EntityEncoder, HttpRoutes}
import org.http4s.dsl.Http4sDsl
import org.http4s.circe._
import io.circe.generic.auto._
import cats.effect.IO

import com.ffb.chess.service.Move
import com.ffb.chess.service.ChessService

object ChessRoutes extends Http4sDsl[IO] {
  implicit val moveEncoder: EntityEncoder[IO, Move] =
    jsonEncoderOf[IO, Move]

  implicit val moveSeqEncoder: EntityEncoder[IO, Seq[Move]] = jsonEncoderOf[IO, Seq[Move]]

  def routes(): HttpRoutes[IO] =
    HttpRoutes.of[IO] {
      case GET -> Root / "api" / "chess" / "bestmove" =>
        ChessService.bestMove().flatMap(Ok(_))
      case GET -> Root / "api" / "chess" / "allmoves" =>
        ChessService.allMoves().flatMap(Ok(_))
    }
}
