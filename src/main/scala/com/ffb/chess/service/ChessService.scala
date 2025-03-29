package com.ffb.chess.service

import cats.effect.IO

import com.ffb.chess.engine.{ChessEngine, ChessEngineClient}
import com.ffb.chess.domain.Move

object ChessService {
  def bestMove(
      fen: Option[String],
      moves: Option[Seq[Move]],
      engineName: Option[String]
  ): IO[Move] = {
    val engine = ChessEngine.fromOption(engineName)
    ChessEngineClient.create(engine).use(_.bestMove(fen, moves))
  }
}
