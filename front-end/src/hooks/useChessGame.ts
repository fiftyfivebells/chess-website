import { useCallback, useState } from "react";
import {
  Board,
  Color,
  GameState,
  Move,
  PieceType,
  Square,
} from "../models/types";
import {
  BISHOP,
  BLACK,
  INITIAL_GAME_STATE,
  KING,
  KNIGHT,
  PAWN,
  QUEEN,
  ROOK,
  WHITE,
} from "../models/constants";
import {
  getBoardFenRep,
  getPieceAtSquare,
  isPawnStartingRank,
  isValidDestination,
  mailboxIndexToSquare,
  placeOnSquare,
  squareToMailboxIndex,
} from "../utils/Board";

export function useChessGame() {
  const [gameState, setGameState] = useState<GameState>(INITIAL_GAME_STATE);

  const applyMove = useCallback(
    (move: Move): boolean => {
      const { from, to, promotion } = move;
      const { board, activeSide, moveHistory } = gameState;

      // check here if the move is valid

      // create new board for after the move
      const newBoard = [...board];
      const movingPiece = promotion
        ? { color: activeSide, pieceType: promotion }
        : getPieceAtSquare(board, from);
      const capturedPiece = getPieceAtSquare(board, to);

      // update the board
      placeOnSquare(newBoard, from, null);

      placeOnSquare(newBoard, to, movingPiece);

      // update the move counts
      const newRule50 =
        movingPiece?.pieceType === PAWN || capturedPiece ? 0 : gameState.rule50;
      const newFullMoveCount =
        activeSide === BLACK
          ? gameState.fullMoveCount + 1
          : gameState.fullMoveCount;

      const nextActiveSide = activeSide === WHITE ? BLACK : WHITE;
      const opponentNoLegalMoves = hasNoLegalMoves(newBoard, nextActiveSide);

      // check for check and checkmate
      const isCheck = isSideInCheck(newBoard, nextActiveSide);
      const isCheckMate = isCheck && opponentNoLegalMoves;

      // check for draws
      const isStaleMate = !isCheck && opponentNoLegalMoves;
      const insufficientMaterial = isInsufficientMaterial(newBoard);
      const fiftyMoveRule = newRule50 >= 50;
      const isDraw = isStaleMate || insufficientMaterial || fiftyMoveRule;

      setGameState({
        board: newBoard,
        activeSide: nextActiveSide,
        epSquare: undefined,
        castleRights: undefined,
        fullMoveCount: newFullMoveCount,
        rule50: newRule50,

        moveHistory: [...moveHistory, move],
        isCheck: isCheck,
        isCheckmate: isCheckMate,
        isStalemate: isStaleMate,
        isDraw: isDraw,
      });

      return false;
    },
    [gameState],
  );

  function getPseudoLegalMovesForPiece(
    state: GameState,
    square: Square,
  ): Move[] {
    const piece = getPieceAtSquare(state.board, square);

    if (!piece) return [];

    const moves: Move[] = [];

    const [N, E, S, W] = [-10, 1, 10, -1];
    const allDirections = {
      n: [
        N + N + E,
        E + E + N,
        E + E + S,
        S + S + E,
        S + S + W,
        W + W + S,
        W + W + N,
        N + N + W,
      ],
      b: [N + E, S + E, S + W, N + W],
      r: [N, E, S, W],
      q: [N, N + E, E, S + E, S, S + W, W, N + W],
      k: [N, N + E, E, S + E, S, S + W, W, N + W],
    } as Record<PieceType, number[]>;

    // for the first round of move generation, just naively create every move for every piece
    // handle the special cases (pawns, castling, etc) later
    const pieceDirections = allDirections[piece.pieceType];
    switch (piece.pieceType) {
      case PAWN: {
        const pawnAttacks = [N + E, N + W];

        // handle pawn attacks
        pawnAttacks.forEach((attack) => {
          const offset = state.activeSide === WHITE ? attack : attack * -1;
          const toIndex = squareToMailboxIndex(square) + offset;
          const targetSquare = mailboxIndexToSquare(toIndex);

          const target = getPieceAtSquare(state.board, targetSquare);
          const validTarget = target && target.color !== state.activeSide;

          // only make the attack move if the target piece is the opposit color OR if the
          // target square is the en passant square
          if (validTarget || state.epSquare === targetSquare) {
            moves.push({
              from: square,
              to: targetSquare,
            });
          }
        });

        // handle double pawn move
        if (isPawnStartingRank(square, piece)) {
          const doublePush = state.activeSide === WHITE ? N * -2 : N * 2;
          const toIndex = squareToMailboxIndex(square) + doublePush;
          const destinationSquare = mailboxIndexToSquare(toIndex);

          // only make the move if the destination square is empty
          if (!getPieceAtSquare(state.board, destinationSquare)) {
            moves.push({
              from: square,
              to: destinationSquare,
            });
          }
        }

        break;
      }
      case KNIGHT:
      case KING: {
        pieceDirections.forEach((direction) => {
          if (
            isValidDestination(state.board, square, direction, state.activeSide)
          ) {
            const toIndex = squareToMailboxIndex(square) + direction;

            moves.push({
              from: square,
              to: mailboxIndexToSquare(toIndex),
            });
          }
        });
        break;
      }
      case BISHOP:
      case ROOK:
      case QUEEN: {
        pieceDirections.forEach((direction) => {
          let offset = squareToMailboxIndex(square) + direction;
          while (
            isValidDestination(state.board, square, offset, state.activeSide)
          ) {
            moves.push({
              from: square,
              to: mailboxIndexToSquare(offset),
            });

            offset += direction;
          }
        });

        break;
      }
    }

    return moves;
  }

  function isValidMove(board: Board, move: Move): boolean {
    return true;
  }

  function hasNoLegalMoves(board: Board, activeSide: Color): boolean {
    const allMoves: Move[] = [];

    board.forEach((piece, mailboxIndex) => {
      if (piece && piece.color == activeSide) {
        const square = mailboxIndexToSquare(mailboxIndex);
        const moves = getPseudoLegalMovesForPiece(
          { board: board, activeSide: activeSide },
          square,
        );

        allMoves.concat(moves);
      }
    });

    // TODO: this isn't quite right yet, since these are pseudo-legal moves.
    // maybe make an unapplyMove function and check which moves cause the king to be in check
    return allMoves.length === 0;
  }

  function isSideInCheck(board: Board, activeSide: Color): boolean {
    return false;
  }

  function isInsufficientMaterial(board: Board): boolean {
    return false;
  }

  const getFen = useCallback(
    (board: Board) => {
      return getBoardFenRep(board);
    },
    [gameState],
  );

  return {
    gameState,
    applyMove,
  };
}
