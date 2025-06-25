package com.ffb.chess.api

import io.circe.Decoder
import io.circe.generic.semiauto.*

import com.ffb.chess.domain.Codecs.given
import com.ffb.zugzwang.move.Move

final case class MoveRequest(
  position: Option[String],
  moves: Option[Seq[Move]],
  engine: Option[String]
)

object MoveRequest:
  given Decoder[MoveRequest] = deriveDecoder[MoveRequest]
