package com.ffb.chess.engine

sealed trait ChessEngine {
  def engineName: String
}

object ChessEngine {
  val defaultEngine: ChessEngine = GoEngine

  def fromString(engineName: String): ChessEngine = engineName match {
    // this will eventually choose the engine based on the given engine name or
    // default to some engine if the names don't match, but there's only one engine
    // right now, so default to Go.
    case "go" => GoEngine
    case _    => defaultEngine
  }

  def fromOption(engineName: Option[String]): ChessEngine = engineName match {
    case None => defaultEngine
    case Some(name) => fromString(name)
  }
}

final case object GoEngine extends ChessEngine {
  override val engineName: String = "./engines/nsdb-go-edition"
}
