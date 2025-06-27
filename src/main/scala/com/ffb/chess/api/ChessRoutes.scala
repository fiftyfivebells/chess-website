package com.ffb.chess.routes

import cats.effect.IO
import io.circe.syntax.*
import org.http4s.{EntityDecoder, EntityEncoder, HttpRoutes}
import org.http4s.dsl.Http4sDsl
import org.http4s.circe.*

import com.ffb.chess.api.MoveRequest
import com.ffb.chess.domain.Codecs.given
import com.ffb.chess.domain.PositionDetails
import com.ffb.chess.repository.ChessGameRepository
import com.ffb.chess.service.ChessService
import com.ffb.chess.service.ChessService.bestMove
import com.ffb.zugzwang.move.Move

object ChessRoutes extends Http4sDsl[IO]:
  given EntityEncoder[IO, Move] = jsonEncoderOf[IO, Move]
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
          for
            pos <- IO(ChessService.newGame)
            _   <- repo.create(pos)
          yield pos.asJson
        )

      case GET -> Root / "all" =>
        Ok(
          for all <- repo.all
          yield all.asJson
        )

      case GET -> Root / UUIDVar(id) / "state" =>
        repo.get(id) flatMap {
          case Some(position) => Ok(position.asJson) //
          case None           => NotFound(s"Game with id $id not found")
        }

      case GET -> Root / UUIDVar(id) / "legalMoves" =>
        repo.get(id) flatMap {
          case Some(position) =>
            ChessService
              .legalMoves(position)
              .fold(
                error => BadRequest(error.toString),
                success => Ok(success.asJson)
              )

          case None => NotFound(s"Game with id $id not found")
        }

      case req @ POST -> Root / UUIDVar(id) / "applyMove" =>
        repo.get(id) flatMap {
          case Some(position) =>
            (for
              move        <- req.as[Move]
              newPosition <- IO.fromEither(ChessService.applyMove(position, move))
            yield newPosition).flatMap(pos => Ok(pos.asJson))

          case None => NotFound(s"Game with id $id not found")
        }

      case req @ POST -> Root / id / "bestmove" =>
        for
          moveReq <- req.as[MoveRequest]
          bestMove <- ChessService.bestMove(
                        moveReq.position,
                        moveReq.moves,
                        moveReq.engine
                      )
          response <- Ok(bestMove)
        yield response
    }
