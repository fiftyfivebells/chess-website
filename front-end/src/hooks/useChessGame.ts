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
  isKingUnderAttack,
  isLastRank,
  isPawnStartingRank,
  isValidDestination,
  mailboxIndexToSquare,
  movePiece,
  placeOnSquare,
  squareToMailboxIndex,
} from "../utils/Board";

export function useChessGame() {
  const [gameState, setGameState] = useState<GameState>(INITIAL_GAME_STATE);

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

        history: [...history, gameState],
        isCheck: isCheck,
        isCheckmate: isCheckMate,
        isStalemate: isStaleMate,
        isDraw: isDraw,
      });

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
        const promotionPieces = [KNIGHT, BISHOP, ROOK, QUEEN];

        // handle pawn attacks
        pawnAttacks.forEach((attack) => {
          const offset = state.activeSide === WHITE ? attack : attack * -1;
          const toIndex = squareToMailboxIndex(square) + offset;
          const targetSquare = mailboxIndexToSquare(toIndex);

          // we need to know whether the target is valid because pawns can only move diagonally when attacking
          const target = getPieceAtSquare(state.board, targetSquare);
          const validTarget = target && target.color !== state.activeSide;

          // only make the attack move if the target piece is the opposite color OR if the
          // target square is the en passant square
          if (
            isValidDestination(state.board, square, offset, state.activeSide) &&
            (validTarget || state.epSquare === targetSquare)
          ) {
            if (isLastRank(square, state.activeSide)) {
              promotionPieces.forEach((promotion) => {
                moves.push({
                  from: square,
                  to: targetSquare,
                  promotion: promotion,
                });
              });
            } else {
              moves.push({
                from: square,
                to: targetSquare,
              });
            }
          }
        });

        const pawnDirection = state.activeSide === WHITE ? N : S;

        // handle single pawn push
        const singlePush = pawnDirection;
        if (
          isValidDestination(state.board, square, singlePush, state.activeSide)
        ) {
          const toIndex = squareToMailboxIndex(square) + singlePush;

          moves.push({
            from: square,
            to: mailboxIndexToSquare(toIndex),
          });
        }

        // handle double pawn move
        const doublePush = singlePush + pawnDirection;
        if (
          isPawnStartingRank(square, piece) &&
          isValidDestination(state.board, square, doublePush, state.activeSide)
        ) {
          const toIndex = squareToMailboxIndex(square) + doublePush;
          moves.push({
            from: square,
            to: mailboxIndexToSquare(toIndex),
          });
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

    // handle castles separately
    if (piece.pieceType === KING) {
      // to do a castle, we need to be sure:
      //   1. the active side has castle rights
      //   2. the squares between the rook and king are not under attack
    }

    return moves;
  }

  function getAllLegalMoves(board: Board, activeSide: Color): Move[] {
    const squares = board.reduce((squares, piece, index) => {
      if (piece && piece.color === activeSide) {
        squares.push(mailboxIndexToSquare(index));
      }
      return squares;
    }, new Array<Square>());

    const pseudoLegalMoves = squares.reduce((moves, square) => {
      const pieceMoves = getPseudoLegalMovesForPiece(gameState, square);

      return moves.concat(pieceMoves);
    }, new Array<Move>());

    return pseudoLegalMoves.reduce((legalMoves, move) => {
      if (isLegalMove(board, move)) {
        legalMoves.push(move);
      }

      return legalMoves;
    }, new Array<Move>());
  }

  /**
   * @remarks
   * This method is a helper that checks whether a move is legal. A legal move is one that does not
   * leave the active side's king in check. If the king is in check after the move, it is illegal and
   * needs to be undone. This will be called on a pseudo-legal move, so there is no need to validate
   * simple things like whether the piece on the target square is on the same side as the one at the
   * from square.
   *
   * @param board - the current state's board array
   * @param move  - the move whose legality is being checked
   *
   * @return a boolean that says whether the move is legal or not
   * */
  function isLegalMove(board: Board, move: Move): boolean {
    const newBoard = movePiece(board, move.from, move.to);

    return !isKingUnderAttack(newBoard, gameState.activeSide);
  }

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
  function isValidMove(board: Board, move: Move): boolean {
    const legalMoves = getAllLegalMoves(board, gameState.activeSide);

    return !!legalMoves.find(
      (m) =>
        m.from === move.from &&
        m.to === move.to &&
        (m.promotion === move.promotion || (!move.promotion && !m.promotion)),
    );
  }

  function hasNoLegalMoves(board: Board, activeSide: Color): boolean {
    const allMoves: Move[] = [];

    board.forEach((piece, mailboxIndex) => {
      if (piece && piece.color == activeSide) {
        const square = mailboxIndexToSquare(mailboxIndex);
        const moves = getPseudoLegalMovesForPiece(gameState, square);

        allMoves.concat(moves);
      }
    });

    // TODO: this needs to be updated to only include legal moves in all moves
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
    isValidMove,
  };
}
