package com.ffb.chess.engine

sealed trait UciCommand {
  def command: String
}

final case object Uci extends UciCommand {
  override val command: String = "uci"
}

final case object UciNewGame extends UciCommand {
  override val command: String = "ucinewgame"
}

final case class Position(fen: Option[String], moves: String)
    extends UciCommand {
  override val command: String = fen match {
    case Some(f) => s"position fen $f $moves"
    case None    => s"position startpos $moves"
  }
}

final case class Go(args: String*) extends UciCommand {
  override val command: String = args match {
    case Nil => "go"
    case lst => s"go ${lst.mkString(" ")}"
  }
}
