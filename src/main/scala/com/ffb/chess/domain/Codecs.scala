package com.ffb.chess.domain

import io.circe.{Decoder, Encoder, HCursor, Json}
import io.circe.generic.semiauto.*
import io.circe.syntax.*

import com.ffb.zugzwang.chess.{PieceType, Square}
import com.ffb.zugzwang.move.{Move, MoveType}

object Codecs:

  // custom Move encoders (since it's an opaque type under the hood)
  given Encoder[Move] = new Encoder[Move]:
    final def apply(m: Move): Json =
      val from      = Square.toAlgebraic(m.from)
      val to        = Square.toAlgebraic(m.to)
      val promotion = m.promotion.map(_.toString)
      val moveType  = m.moveType.toString

      Json.obj(
        ("from", from.asJson),
        ("to", to.asJson),
        ("promotion", promotion.asJson),
        ("moveType", moveType.asJson)
      )

  // TODO: this probably needs to be refactored. It's not really getting the benefit
  // of the Either from .fromAlgebraic, since I'm just assuming the value is right
  // and throwing in a dumb default if it's not
  given Decoder[Move] = new Decoder[Move]:
    final def apply(c: HCursor): Decoder.Result[Move] =
      for
        from <- c.downField("from").as[String]
        fromSquare = Square.fromAlgebraic(from) match
                       case Right(sq) => sq
                       case Left(_)   => Square.A1

        to <- c.downField("to").as[String]
        toSquare = Square.fromAlgebraic(to) match
                     case Right(sq) => sq
                     case Left(_)   => Square.A1
        promotion <- c.downField("promotion").as[Option[String]]
        promo      = promotion.flatMap(PieceType.fromString(_))
        moveType  <- c.downField("moveType").as[String]
      yield (Move(fromSquare, toSquare, promo, MoveType.Quiet))
