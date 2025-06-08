package com.ffb.chess.engine

sealed trait UciCommand {
  def command: String
}

case object Uci extends UciCommand {
  override val command: String = "uci"
}

case object UciNewGame extends UciCommand {
  override val command: String = "ucinewgame"
}

case class Position(fen: Option[String], moves: String)
    extends UciCommand {
  override val command: String = fen match {
    case Some(f) => s"position fen $f $moves"
    case None    => s"position startpos $moves"
  }
}

case class Go(args: String*) extends UciCommand {
  override val command: String = args match {
    case Nil => "go"
    case lst => s"go ${lst.mkString(" ")}"
  }
}
