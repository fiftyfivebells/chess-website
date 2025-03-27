package com.ffb.chess.service

import io.circe.{Encoder, Decoder}
import io.circe.generic.semiauto._
import cats.effect.IO

import com.ffb.chess.ChessEngineClient

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

object ChessService {
  val GoEngine = "./engines/nsdb-go-edition"

  def bestMove(fen: String = "startpos"): IO[Move] = {
    ChessEngineClient.create(GoEngine).use { engine =>
      for {
        _ <- engine.runCommand("ucinewgame")
        _ <- engine.runCommand(s"position $fen")
        output <- engine.runCommand("go")
        move = output.dropWhile(_ != ' ').trim
        _ <- IO.println(s"string: $move, move: ${Move.fromString(move)}")
      } yield Move.fromString(move)
    }
  }

  def allMoves(fen: String = "startpos"): IO[Seq[Move]] = {
    ChessEngineClient.create(GoEngine).use { engine =>
      for {
        _ <- engine.runCommand("ucinewgame")
        _ <- engine.runCommand(s"position $fen")
        output <- engine.runCommand("go allmoves")
      } yield transformAllMovesOutput(output)
    }
  }

  /** Transforms the output from the engine when given the command "go allmoves"
    *
    * The engine's "go allmoves" command will always return output of the
    * following shape: allmoves [.. .. .. ..] where the .. represents a move.
    *
    * This private method takes in that output and converts it into a sequence
    * of Move objects to be returned by the allMoves method.
    */
  private def transformAllMovesOutput(output: String): Seq[Move] = {
    val moves = output.dropWhile(_ != '[').trim

    Move.fromListString(moves)
  }
}
