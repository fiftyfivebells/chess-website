package com.ffb.chess.api

import io.circe.Decoder
import io.circe.generic.semiauto._
import com.ffb.chess.domain.Move

final case class MoveRequest(position: Option[String], moves: Option[Seq[Move]], engine: Option[String])

object MoveRequest {
//  implicit val encoder: Encoder[MoveRequest] = deriveEncoder[MoveRequest]
  implicit val decoder: Decoder[MoveRequest] = deriveDecoder[MoveRequest]
}
