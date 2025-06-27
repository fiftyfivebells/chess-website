package com.ffb.chess.service

import cats.effect.IO

import com.ffb.chess.domain.PositionDetails
import com.ffb.chess.engine.{ChessEngine, ChessEngineClient}
import com.ffb.zugzwang.move.Move
import com.ffb.zugzwang.notation.FENParserError
import com.ffb.zugzwang.Zugzwang


object ChessService:
  def newGame: PositionDetails =
    PositionDetails.from(Zugzwang.initial)

  def legalMoves(position: PositionDetails): Either[FENParserError, List[Move]] =
    Zugzwang.legalMoves(position.fen).map(_.toList)

  def applyMove(position: PositionDetails, move: Move): Either[FENParserError, PositionDetails] =
    Zugzwang.applyMove(position.fen, move) map { gameState =>
      PositionDetails.from(gameState)
    }

  def bestMove(
    fen: Option[String],
    moves: Option[Seq[Move]],
    engineName: Option[String]
  ): IO[String] =
    val engine = ChessEngine.fromOption(engineName)
    ChessEngineClient.create(engine).use(_.bestMove(fen, moves))
