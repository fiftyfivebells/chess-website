package com.ffb.chess.service

import cats.effect.IO

import com.ffb.chess.domain.PositionDetails
import com.ffb.chess.engine.{ChessEngine, ChessEngineClient}
import com.ffb.zugzwang.move.Move
import com.ffb.zugzwang.Zugzwang

object ChessService:
  def newGame: PositionDetails =
    PositionDetails.from(Zugzwang.initial)

  def bestMove(
    fen: Option[String],
    moves: Option[Seq[Move]],
    engineName: Option[String]
  ): IO[String] =
    val engine = ChessEngine.fromOption(engineName)
    ChessEngineClient.create(engine).use(_.bestMove(fen, moves))
