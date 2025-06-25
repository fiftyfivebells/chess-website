package com.ffb.chess.domain

import io.circe.generic.semiauto.*
import io.circe.{Encoder, Decoder}


enum Piece:
  case Pawn, Knight, Bishop, Rook, Queen, King

  override def toString(): String = this match {
    case Piece.Pawn   => "p"
    case Piece.Knight => "n"
    case Piece.Bishop => "b"
    case Piece.Rook   => "r"
    case Piece.Queen  => "q"
    case Piece.King   => "k"
  }

object Piece:
  implicit val encoder: Encoder[Piece] = deriveEncoder[Piece]
  implicit val decoder: Decoder[Piece] = deriveDecoder[Piece]

  def fromString(piece: String): Piece = piece match {
    case "p" => Piece.Pawn
    case "n" => Piece.Knight
    case "b" => Piece.Bishop
    case "r" => Piece.Rook
    case "q" => Piece.Queen
    case "k" => Piece.King
  }
