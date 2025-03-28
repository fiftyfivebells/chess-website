package com.ffb.chess.domain

import io.circe.{Encoder, Decoder}
import io.circe.generic.semiauto._

sealed trait Piece {
  override def toString(): String = this match {
    case Piece.Pawn   => "p"
    case Piece.Knight => "n"
    case Piece.Bishop => "b"
    case Piece.Rook   => "r"
    case Piece.Queen  => "q"
    case Piece.King   => "k"
  }
}
object Piece {
  implicit val encoder: Encoder[Piece] = deriveEncoder[Piece]
  implicit val decoder: Decoder[Piece] = deriveDecoder[Piece]

  final case object Pawn extends Piece
  final case object Knight extends Piece
  final case object Bishop extends Piece
  final case object Rook extends Piece
  final case object Queen extends Piece
  final case object King extends Piece

  def fromString(piece: String): Piece = piece match {
    case "p" => Piece.Pawn
    case "n" => Piece.Knight
    case "b" => Piece.Bishop
    case "r" => Piece.Rook
    case "q" => Piece.Queen
    case "k" => Piece.King
  }
}
