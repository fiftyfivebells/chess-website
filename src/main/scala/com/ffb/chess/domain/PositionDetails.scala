package com.ffb.chess.domain

import io.circe.{Decoder, Encoder}
import io.circe.generic.semiauto.*
import java.util.UUID

import com.ffb.chess.domain.Codecs.given
import com.ffb.zugzwang.chess.{Color, GameState}
import com.ffb.zugzwang.move.Move
import com.ffb.zugzwang.Zugzwang

enum GameStatus:
  case Ongoing, Check, Checkmate, Stalemate, Draw

object GameStatus:
  given Encoder[GameStatus] = Encoder.encodeString.contramap {
    case GameStatus.Ongoing   => "ongoing"
    case GameStatus.Check     => "check"
    case GameStatus.Checkmate => "checkmate"
    case GameStatus.Stalemate => "stalemate"
    case GameStatus.Draw      => "draw"
  }

  given Decoder[GameStatus] = Decoder.decodeString.emap {
    case "ongoing"   => Right(GameStatus.Ongoing)
    case "check"     => Right(GameStatus.Check)
    case "checkmate" => Right(GameStatus.Checkmate)
    case "stalemate" => Right(GameStatus.Stalemate)
    case "draw"      => Right(GameStatus.Draw)
    case other       => Left(s"Invalid GameStatus: $other")
  }

  def from(gs: GameState): GameStatus =
    if gs.isCheck then GameStatus.Check
    else if gs.isCheckmate then GameStatus.Checkmate
    else if gs.isStalemate then GameStatus.Stalemate
    else if gs.isDraw then GameStatus.Draw
    else GameStatus.Ongoing

given Encoder[Color] = Encoder.encodeString.contramap {
  case Color.White => "white"
  case Color.Black => "black"
}

given Decoder[Color] = Decoder.decodeString.emap {
  case "white" => Right(Color.White)
  case "black" => Right(Color.Black)
  case other   => Left(s"Invalid color: $other")
}

case class PositionDetails(
  gameId: UUID,
  fen: String,
  status: GameStatus,
  activeColor: Color,
  legalMoves: List[Move],
  history: List[String]
)

object PositionDetails:

  given Encoder[PositionDetails] = deriveEncoder[PositionDetails]
  given Decoder[PositionDetails] = deriveDecoder[PositionDetails]

  def from(state: GameState): PositionDetails =
    val fen  = state.toFen
    val uuid = UUID.randomUUID()

    val moves = Zugzwang.legalMoves(state)

    PositionDetails(
      uuid,
      fen,
      GameStatus.from(state),
      state.activeSide,
      moves.toList,
      state.history
    )
