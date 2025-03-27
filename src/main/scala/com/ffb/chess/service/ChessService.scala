package com.ffb.chess.service

import io.circe.{Encoder, Decoder}
import io.circe.generic.semiauto._
import cats.effect.IO

import com.ffb.chess.ChessEngineClient

case class BestMove(move: String)
object BestMove {
  implicit val encoder: Encoder[BestMove] = deriveEncoder[BestMove]
  implicit val decoder: Decoder[BestMove] = deriveDecoder[BestMove]
}

object ChessService {
  def bestMove(): IO[BestMove] = {
    ChessEngineClient.create("./nsdb-go-edition").use { engine =>
      for {
        _ <- engine.runCommand("ucinewgame")
        _ <- engine.runCommand("position startpos")
        output <- engine.runCommand("go")
      } yield BestMove(output)
    }
  }
}
