package com.ffb.chess.service

import io.circe.{Encoder, Decoder}
import io.circe.generic.semiauto._

case class BestMove(move: String)

object BestMove {
  implicit val encoder: Encoder[BestMove] = deriveEncoder[BestMove]
  implicit val decoder: Decoder[BestMove] = deriveDecoder[BestMove]
}

object ChessService {
  def bestMove(): BestMove = BestMove("best move")
}
