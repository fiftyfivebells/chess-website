package com.ffb.chess.routes

import org.http4s.{EntityEncoder, HttpRoutes}
import org.http4s.dsl.Http4sDsl
import org.http4s.circe._
import io.circe.generic.auto._
import cats.effect.IO

import com.ffb.chess.domain.Move
import com.ffb.chess.service.ChessService
import org.http4s.EntityDecoder
import com.ffb.chess.api.MoveRequest

object ChessRoutes extends Http4sDsl[IO] {
  implicit val moveEncoder: EntityEncoder[IO, Move] =
    jsonEncoderOf[IO, Move]

  implicit val moveSeqEncoder: EntityEncoder[IO, Seq[Move]] =
    jsonEncoderOf[IO, Seq[Move]]

  implicit val moveRequestDecoder: EntityDecoder[IO, MoveRequest] =
    jsonOf[IO, MoveRequest]

  def routes(): HttpRoutes[IO] =
    HttpRoutes.of[IO] { case req @ POST -> Root / "bestmove" =>
      for {
        moveReq <- req.as[MoveRequest]
        bestMove <- ChessService.bestMove(
          moveReq.position,
          moveReq.moves,
          moveReq.engine
        )
        response <- Ok(bestMove)
      } yield response
    }
}
