package com.ffb.chess.service

import cats.effect.IO

import com.ffb.chess.engine.{ChessEngine, ChessEngineClient, GoEngine}
import com.ffb.chess.domain.Move

object ChessService {
  def bestMove(
      fen: Option[String],
      engine: ChessEngine = GoEngine
  ): IO[Move] =
    ChessEngineClient.create(engine).use(_.bestMove(fen))

  def allMoves(
      fen: Option[String],
      engine: ChessEngine = GoEngine
  ): IO[Seq[Move]] =
    ChessEngineClient.create(engine).use(_.allMoves(fen))
}
