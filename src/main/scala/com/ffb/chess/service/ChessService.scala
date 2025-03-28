package com.ffb.chess.service

import cats.effect.IO

import com.ffb.chess.engine.{ChessEngine, ChessEngineClient}
import com.ffb.chess.domain.Move

object ChessService {
  def bestMove(
      fen: Option[String],
      engineName: Option[String]
  ): IO[Move] = {
    val engine = ChessEngine.fromOption(engineName)
    ChessEngineClient.create(engine).use(_.bestMove(fen))
  }

  def allMoves(
      fen: Option[String],
      engineName: Option[String]
  ): IO[Seq[Move]] = {
    val engine = ChessEngine.fromOption(engineName)
    ChessEngineClient.create(engine).use(_.allMoves(fen))
  }
}
