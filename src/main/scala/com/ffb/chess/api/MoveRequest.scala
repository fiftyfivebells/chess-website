package com.ffb.chess.api

import io.circe.Decoder
import io.circe.generic.semiauto._

final case class MoveRequest(position: Option[String], engine: Option[String])

object MoveRequest {
//  implicit val encoder: Encoder[MoveRequest] = deriveEncoder[MoveRequest]
  implicit val decoder: Decoder[MoveRequest] = deriveDecoder[MoveRequest]
}
