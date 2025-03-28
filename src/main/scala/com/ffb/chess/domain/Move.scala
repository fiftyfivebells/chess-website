package com.ffb.chess.domain

import io.circe.{Encoder, Decoder}
import io.circe.generic.semiauto._

case class Move(from: String, to: String, promotion: Option[Piece]) {
  override def toString(): String = promotion match {
    case Some(promotion) => s"$from$to$promotion"
    case None            => s"$from$to"
  }
}

object Move {
  implicit val encoder: Encoder[Move] = deriveEncoder[Move]
  implicit val decoder: Decoder[Move] = deriveDecoder[Move]

  def fromString(move: String): Move = {
    // the first 2 characters should be the from coordinates, eg "e2"
    val from = move.take(2)

    // the 3rd and 4th characters should be the to coordinates, eg "e4"
    val to = move.drop(2).take(2)

    // the 5th character (if it exists) should be the promotion piece, eg "q"
    val promotion = move.drop(4).take(1) match {
      case "" => None
      case p  => Option(Piece.fromString(p))
    }

    Move(from, to, promotion)
  }

  def fromListString(move: String): Seq[Move] = {
    val moves = move.drop(1).dropRight(1)

    moves.split(" ").toSeq.map(Move.fromString(_))
  }
}
