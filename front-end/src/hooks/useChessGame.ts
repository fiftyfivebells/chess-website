import { useCallback, useState } from "react";
import { Board, Color, GameState, Move } from "../models/types";
import { BLACK, INITIAL_GAME_STATE, PAWN, WHITE } from "../models/constants";
import {
  getBoardFenRep,
  getPieceAtSquare,
  placeOnSquare,
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

  function isValidMove(board: Board, move: Move): boolean {
    return true;
  }

  function hasNoLegalMoves(board: Board, activeSide: Color): boolean {
    return false;
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
