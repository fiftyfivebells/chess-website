package com.ffb.chess.engine

sealed trait ChessEngine {
  def engineName: String
}

final case object GoEngine extends ChessEngine {
  override val engineName: String = "./engines/nsdb-go-edition"
}
