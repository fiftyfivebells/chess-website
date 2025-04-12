import { useCallback, useEffect, useState } from "react";
import {
  BLACK,
  INITIAL_GAME_STATE,
  INITIAL_STATE_MOVES,
  KING,
  N,
  PAWN,
  ROOK,
  S,
  WHITE,
} from "../models/constants";
import {
  Board,
  CastleRights,
  Color,
  GameConfig,
  GameState,
  Move,
  Piece,
  Square,
} from "../models/types";
import {
  getAllLegalMoves,
  getBoardFenRep,
  getPieceAtSquare,
  handleCastleMove,
  isKingUnderAttack,
  mailboxIndexToSquare,
  placeOnSquare,
  squareToMailboxIndex,
} from "../utils/Board";

export function useChessGame() {
  // TODO: maybe add a game over state?

  const [gameState, setGameState] = useState<GameState>(INITIAL_GAME_STATE);
  const [timers, setTimers] = useState<{ white: number; black: number }>({
    white: 0,
    black: 0,
  });
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameActive, setIsGameActive] = useState<boolean>(false);
  const [legalMoves, setLegalMoves] = useState<Move[]>(INITIAL_STATE_MOVES);

  const applyMove = useCallback(
    (move: Move): boolean => {
      const { from, to, promotion } = move;
      const { board, epSquare, activeSide, history } = gameState;

      // create new board for after the move
      const newBoard = [...board];
      const movingPiece = promotion
        ? { color: activeSide, pieceType: promotion }
        : getPieceAtSquare(board, from);
      const capturedPiece =
        movingPiece?.pieceType === PAWN && move.to === epSquare
          ? {
              pieceType: PAWN,
              color: activeSide === WHITE ? BLACK : WHITE,
            }
          : getPieceAtSquare(board, to);

      // update the board
      placeOnSquare(newBoard, from, null);
      placeOnSquare(newBoard, to, movingPiece);

      // handle setting the en passant square
      let newEpSquare;
      if (movingPiece && moveTriggersEPSquare(movingPiece, move)) {
        const fromIndex = squareToMailboxIndex(move.from);
        const epSquareIndex =
          activeSide === WHITE ? fromIndex + N : fromIndex + S;

        newEpSquare = mailboxIndexToSquare(epSquareIndex);
      }

      // handle an en passant capture
      if (move.to === epSquare) {
        const toIndex = squareToMailboxIndex(move.to);
        const epTarget = activeSide === WHITE ? toIndex + S : toIndex + N;

        placeOnSquare(newBoard, mailboxIndexToSquare(epTarget), null);
      }

      // handle the castles
      if (moveIsCastle(board, activeSide, move)) {
        handleCastleMove(newBoard, move, activeSide);
      }

      const newCastleRights = gameState.castleRights
        ? updateCastleRights(
            gameState.board,
            gameState.activeSide,
            move,
            gameState.castleRights,
          )
        : undefined;

      // add captured pieces to the lists
      const newWhiteCaptured =
        capturedPiece && capturedPiece.color === WHITE
          ? [...gameState.capturedPieces[WHITE], capturedPiece]
          : [...gameState.capturedPieces[WHITE]];
      const newBlackCaptured =
        capturedPiece && capturedPiece.color === BLACK
          ? [...gameState.capturedPieces[BLACK], capturedPiece]
          : [...gameState.capturedPieces[BLACK]];

      // update the move counts
      const newRule50 =
        movingPiece?.pieceType === PAWN || capturedPiece
          ? 0
          : gameState.rule50 + 1;
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

      const newGameState: GameState = {
        board: newBoard,
        activeSide: nextActiveSide,
        epSquare: newEpSquare,
        castleRights: newCastleRights,
        fullMoveCount: newFullMoveCount,
        rule50: newRule50,

        capturedPieces: {
          white: newWhiteCaptured,
          black: newBlackCaptured,
        },
        history: [...history, gameState],
        isCheck: isCheck,
        isCheckmate: isCheckMate,
        isStalemate: isStaleMate,
        isDraw: isDraw,

        config: gameState.config,
      };

      // handle incrementing the time if necessary
      const increment = gameState.config.timeControl.increment;
      if (increment > 0) {
        setTimers((prev) => ({
          ...prev,
          [activeSide]: prev[activeSide] + increment,
        }));
      }

      setGameState(newGameState);
      setLegalMoves(
        getAllLegalMoves(
          newGameState.board,
          newGameState.activeSide,
          newGameState.castleRights,
          newGameState.epSquare,
        ),
      );

      return true;
    },
    [gameState, timers],
  );

  function moveTriggersEPSquare(movedPiece: Piece, move: Move): boolean {
    const isPawn = movedPiece.pieceType === PAWN;
    const isDoublePush =
      Math.abs(
        squareToMailboxIndex(move.to) - squareToMailboxIndex(move.from),
      ) == 20;

    return isPawn && isDoublePush;
  }

  function moveIsCastle(board: Board, activeSide: Color, move: Move): boolean {
    const isKing = getPieceAtSquare(board, move.from)?.pieceType === KING;
    const kingSquare = activeSide === WHITE ? "e1" : "e8";
    const validDestination =
      activeSide === WHITE
        ? move.to === "g1" || move.to === "c1"
        : move.to === "g8" || move.to === "c8";

    return isKing && kingSquare && validDestination;
  }

  function updateCastleRights(
    board: Board,
    activeSide: Color,
    move: Move,
    oldCastleRights: CastleRights,
  ): CastleRights {
    // if king moved, take away all rights
    // if rook moved, take away rights for that side
    const { ...newCastleRights } = oldCastleRights;
    const kingSideRook = activeSide === WHITE ? "h1" : "h8";
    const queenSideRook = activeSide === BLACK ? "a1" : "a8";

    const movingPiece = getPieceAtSquare(board, move.from);
    if (movingPiece?.pieceType === KING) {
      newCastleRights[activeSide].kingSide = false;
      newCastleRights[activeSide].queenSide = false;
    }

    if (movingPiece?.pieceType === ROOK && move.from === kingSideRook)
      newCastleRights[activeSide].kingSide = false;

    if (movingPiece?.pieceType === ROOK && move.from === queenSideRook)
      newCastleRights[activeSide].queenSide = false;

    return newCastleRights;
  }

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

  function hasNoLegalMoves(
    board: Board,
    activeSide: Color,
    castleRights?: CastleRights,
    epSquare?: Square,
  ): boolean {
    return (
      getAllLegalMoves(board, activeSide, castleRights, epSquare).length === 0
    );
  }

  function isSideInCheck(board: Board, activeSide: Color): boolean {
    return isKingUnderAttack(board, activeSide);
  }

  // TODO: needs an implementation
  function isInsufficientMaterial(board: Board): boolean {
    return false;
  }

  function getCastleRightsString(castleRights: CastleRights): string {
    const castleRightsArray: string[] = [];

    if (castleRights.white.kingSide) castleRightsArray.push("K");
    if (castleRights.white.queenSide) castleRightsArray.push("Q");
    if (castleRights.black.kingSide) castleRightsArray.push("k");
    if (castleRights.black.queenSide) castleRightsArray.push("q");

    return castleRightsArray.join("");
  }

  const getFen = useCallback(() => {
    const boardFen = getBoardFenRep(gameState.board);
    const color = gameState.activeSide[0];
    const castleRights = gameState.castleRights
      ? getCastleRightsString(gameState.castleRights)
      : "-";
    const epSquare = gameState.epSquare ? gameState.epSquare : "-";
    const rule50 = gameState.rule50;
    const fullMove = gameState.fullMoveCount;

    return `${boardFen} ${color} ${castleRights} ${epSquare} ${rule50} ${fullMove}`;
  }, [gameState]);

  function startGame(config: GameConfig): void {
    const { ...newGameState } = gameState;

    newGameState.config = config;

    const initialTime = config.timeControl.initialTime;
    setTimers({ white: initialTime * 60, black: initialTime * 60 });

    setIsGameActive(true);
    setGameState(newGameState);
  }

  function resetGame(): void {
    setIsGameActive(false);
    setGameState(INITIAL_GAME_STATE);
    setLegalMoves(INITIAL_STATE_MOVES);
    setTimers({ white: 0, black: 0 });
  }

  function togglePaused(): void {
    setIsPaused(!isPaused);
  }

  // Timer Logic
  useEffect(() => {
    if (!isGameActive || isPaused) {
      return;
    }

    const intervalId = setInterval(() => {
      setTimers((prevTimers) => {
        const activeSide = gameState.activeSide;
        const currentTime = prevTimers[activeSide];

        // if time is already zero or less, shouldn't happen if checked below, but safety check
        if (currentTime <= 0) {
          return prevTimers;
        }

        const newTime = currentTime - 1;

        if (newTime <= 0) {
          setIsGameActive(false);

          // TODO: should I add a game over state? I would set the time out loss here
          // return timers with 0 for the timed-out player
          return { ...prevTimers, [activeSide]: 0 };
        }

        // otherwise return the decremented time
        return { ...prevTimers, [activeSide]: newTime };
      });
    }, 1000); // decrement every 1000ms (1 second)

    return () => {
      clearInterval(intervalId); // stop the interval
    };
  }, [
    isGameActive,
    isPaused,
    gameState.activeSide, // re-run when turn changes (to time the correct player)
  ]);

  return {
    gameState,
    applyMove,
    isValidMove,
    getFen,
    startGame,
    resetGame,
    togglePaused,
    isPaused,
    isGameActive,
    timers,
  };
}
