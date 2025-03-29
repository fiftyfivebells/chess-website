package com.ffb.chess.engine

sealed trait ChessEngine {
  def engineName: String

}

object ChessEngine {
  private val EngineDirPrefix = "./engines/"

  val defaultEngine: ChessEngine = Stockfish

  def fromString(engineName: String): ChessEngine = engineName match {
    // this will eventually choose the engine based on the given engine name or
    // default to some engine if the names don't match, but there's only one engine
    // right now, so default to Go.
    case "go" => GoEngine
    case _    => defaultEngine
  }

  def fromOption(engineName: Option[String]): ChessEngine = engineName match {
    case None       => defaultEngine
    case Some(name) => fromString(name)
  }

  def makeEngineName(engineName: String): String =
    s"$EngineDirPrefix$engineName"
}

final case object GoEngine extends ChessEngine {
  override val engineName: String =
    ChessEngine.makeEngineName("nsdb-go-edition")
}

final case object Stockfish extends ChessEngine {
  override val engineName: String =
    ChessEngine.makeEngineName("stockfish")
}
