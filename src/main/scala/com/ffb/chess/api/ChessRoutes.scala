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
import com.ffb.chess.repository.ChessGameRepository
import com.ffb.zugzwang.chess.{GameState, Square}
import com.ffb.zugzwang.move.Move as Move2
import com.ffb.zugzwang.move.MoveType
import com.ffb.zugzwang.Zugzwang
import com.ffb.chess.domain.PositionDetails
import com.ffb.chess.domain.PositionDetails.given

object ChessRoutes extends Http4sDsl[IO]:
  implicit val moveEncoder: EntityEncoder[IO, Move] =
    jsonEncoderOf[IO, Move]

  given EntityDecoder[IO, Move] = jsonOf[IO, Move]

  given EntityDecoder[IO, List[PositionDetails]] =
    jsonOf[IO, List[PositionDetails]]

  implicit val moveSeqEncoder: EntityEncoder[IO, Seq[Move]] =
    jsonEncoderOf[IO, Seq[Move]]

  implicit val moveRequestDecoder: EntityDecoder[IO, MoveRequest] =
    jsonOf[IO, MoveRequest]

  def routes(repo: ChessGameRepository[IO]): HttpRoutes[IO] =
    HttpRoutes.of[IO] {
      case GET -> Root / "new" =>
        Ok(
          for {
            pos <- IO(PositionDetails.from(GameState.initial))
            _ <- repo.create(pos)
          } yield pos.asJson
        )
      // IO(PositionDetails.from(GameState.initial)) flatMap { pos =>
      //   if repo.update(pos.gameId, pos) then Ok(pos.asJson)
      //   else NotFound("Bad idea")
      // }

      case GET -> Root / "all" =>
        Ok(for {
          all <- repo.all
        } yield all.asJson)

      case GET -> Root / UUIDVar(id) / "state" =>
        repo.get(id) flatMap {
          case Some(position) => Ok(position.asJson) //
          case None           => NotFound(s"Game with id $id not found")
        }

      case GET -> Root / UUIDVar(id) / "legalMoves" =>
        repo.get(id) flatMap {
          case Some(position) => Ok(position.legalMoves.asJson)
          case None           => NotFound(s"Game with id $id not found")
        }

      case req @ POST -> Root / UUIDVar(id) / "applyMove" =>
        repo.get(id) flatMap {
          case Some(position) =>
            Ok(for {
              m <- req.as[Move]
              move = Move2(
                Square.E2,
                Square.E4,
                None,
                MoveType.DoublePush
              )
              moved <- IO.fromEither(Zugzwang.applyMove(position.fen, move))
              newPosition = PositionDetails.from(moved)
            } yield newPosition.asJson)

          case None => NotFound(s"Game with id $id not found")
        }

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
    }
