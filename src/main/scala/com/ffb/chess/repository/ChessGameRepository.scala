package com.ffb.chess.repository

import cats.effect.kernel.Async
import cats.effect.Ref
import cats.syntax.functor.*
import java.util.UUID

import com.ffb.chess.domain.PositionDetails

sealed trait ChessGameRepository[F[_]]:
  def create(details: PositionDetails): F[Unit]
  def get(id: UUID): F[Option[PositionDetails]]
  def update(id: UUID, newState: PositionDetails): F[Boolean]
  def all: F[List[PositionDetails]]

object ChessGameRepository:
  def create[F[_]: Async]: F[ChessGameRepository[F]] = for {
    ref <- Ref.of[F, Map[UUID, PositionDetails]](Map.empty)
  } yield new ChessGameRepository[F] {
    override def create(details: PositionDetails): F[Unit] =
      ref.update(_ + (details.gameId -> details))

    override def get(id: UUID): F[Option[PositionDetails]] =
      ref.get.map(_.get(id))

    override def update(id: UUID, newState: PositionDetails): F[Boolean] =
      ref.modify { m =>
        if m.contains(id) then (m.updated(id, newState), true)
        else (m, false)
      }

    override def all: F[List[PositionDetails]] =
      ref.get.map(_.values.toList)
  }
