package com.ffb.chess.routes

import cats.effect.IO
import io.circe.syntax.*
import org.http4s.{EntityDecoder, EntityEncoder, HttpRoutes}
import org.http4s.dsl.Http4sDsl
import org.http4s.circe.*

import com.ffb.chess.api.MoveRequest
import com.ffb.chess.domain.Move
import com.ffb.chess.service.ChessService
import com.ffb.chess.service.ChessService.bestMove
import com.ffb.zugzwang.chess.GameState

object ChessRoutes extends Http4sDsl[IO]:
  implicit val moveEncoder: EntityEncoder[IO, Move] =
    jsonEncoderOf[IO, Move]

  implicit val moveSeqEncoder: EntityEncoder[IO, Seq[Move]] =
    jsonEncoderOf[IO, Seq[Move]]

  implicit val moveRequestDecoder: EntityDecoder[IO, MoveRequest] =
    jsonOf[IO, MoveRequest]

  def routes(): HttpRoutes[IO] =
    HttpRoutes.of[IO] {
      case GET -> Root / "new" => ???

      case GET -> Root / id / "state" => ???

      case GET -> Root / id / "legalMoves" => ???

      case req @ POST -> Root / id / "applyMove" => ???

      case req @ POST -> Root / id / "bestmove" =>
        for {
          moveReq <- req.as[MoveRequest]
          bestMove <- ChessService.bestMove(
            moveReq.position,
            moveReq.moves,
            moveReq.engine
          )
          response <- Ok(bestMove)
        } yield response

      case GET -> Root / "ping" =>
        val initFen = GameState.initialFEN

        Ok(Map("initialFen" -> initFen).asJson)

    }
