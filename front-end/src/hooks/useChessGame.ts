import { useCallback, useState } from "react";
import {
  BLACK,
  INITIAL_GAME_STATE,
  INITIAL_STATE_MOVES,
  PAWN,
  WHITE,
} from "../models/constants";
import { Board, Color, GameState, Move } from "../models/types";
import {
  getAllLegalMoves,
  getBoardFenRep,
  getPieceAtSquare,
  isKingUnderAttack,
  placeOnSquare,
} from "../utils/Board";

export function useChessGame() {
  const [gameState, setGameState] = useState<GameState>(INITIAL_GAME_STATE);
  const [legalMoves, setLegalMoves] = useState<Move[]>(INITIAL_STATE_MOVES);

  const applyMove = useCallback(
    (move: Move): boolean => {
      const { from, to, promotion } = move;
      const { board, activeSide, history } = gameState;

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
      const opponentNoLegalMoves = hasNoLegalMoves();

      // check for check and checkmate
      const isCheck = isSideInCheck(newBoard, nextActiveSide);
      const isCheckMate = isCheck && opponentNoLegalMoves;

      // check for draws
      const isStaleMate = !isCheck && opponentNoLegalMoves;
      const insufficientMaterial = isInsufficientMaterial(newBoard);
      const fiftyMoveRule = newRule50 >= 50;
      const isDraw = isStaleMate || insufficientMaterial || fiftyMoveRule;

      const newGameState: GameState = {
        board: newBoard,
        activeSide: nextActiveSide,
        epSquare: undefined,
        castleRights: undefined,
        fullMoveCount: newFullMoveCount,
        rule50: newRule50,

        history: [...history, gameState],
        isCheck: isCheck,
        isCheckmate: isCheckMate,
        isStalemate: isStaleMate,
        isDraw: isDraw,
      };

      setGameState(newGameState);

      setLegalMoves(getAllLegalMoves(newGameState, nextActiveSide));

      return true;
    },
    [gameState],
  );

  const unApplyPreviousMove = useCallback((): boolean => {
    const newHistory = [...gameState.history];

    newHistory.pop(); // this removes the most recent game state from the history

    const oldState = newHistory.pop();
    if (!oldState) return false;

    setGameState(oldState);
    return true;
  }, [gameState]);

  /**
   * @remarks
   * This method is a helper that checks whether a move is available to the active side. It will be used
   * to prevent the user from moving the wrong side's pieces, moving their own pieces in incorrect ways,
   * or making a move that leaves the king in check.
   *
   * @param board - the current state's board array
   * @param move  - the move whose validity is being checked
   *
   * @return a boolean that says whether the move is valid or not
   * */
  function isValidMove(move: Move): boolean {
    return !!legalMoves.find(
      (m) =>
        m.from === move.from &&
        m.to === move.to &&
        (m.promotion === move.promotion || (!move.promotion && !m.promotion)),
    );
  }

  function hasNoLegalMoves(): boolean {
    return legalMoves.length === 0;
  }

  function isSideInCheck(board: Board, activeSide: Color): boolean {
    return isKingUnderAttack(board, activeSide);
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
    isValidMove,
    legalMoves,
  };
}
