import { createBoardFromFen, getAllLegalMoves } from "../utils/Board";
import { Color, GameState, GameStatus, Piece, PieceType } from "./types";

export const WHITE: Color = "white";
export const BLACK: Color = "black";

export const PAWN: PieceType = "p";
export const KNIGHT: PieceType = "n";
export const BISHOP: PieceType = "b";
export const ROOK: PieceType = "r";
export const QUEEN: PieceType = "q";
export const KING: PieceType = "k";

export const CHECKMATE: GameStatus = "checkmate";
export const CHECK: GameStatus = "check";
export const DRAW: GameStatus = "draw";
export const STALEMATE: GameStatus = "stalemate";
export const ACTIVE: GameStatus = "active";

export const INITIAL_STATE_FEN =
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 0";

// cardinal directions to be used for navigating the board
export const [N, E, S, W] = [-10, 1, 10, -1];

export const INITIAL_GAME_STATE = {
  board: createBoardFromFen(INITIAL_STATE_FEN),
  activeSide: WHITE,
  castleRights: {
    WHITE: {
      kingSide: true,
      queenSide: true,
    },
    BLACK: {
      kingSide: true,
      queenSide: true,
    },
  },
  fullMoveCount: 1,
  rule50: 0,
  history: [] as GameState[],
  whiteCaptured: [] as Piece[],
  blackCaptured: [] as Piece[],

  isCheck: false,
  isCheckmate: false,
  isStalemate: false,
  isDraw: false,
};

export const INITIAL_STATE_MOVES = getAllLegalMoves(
  INITIAL_GAME_STATE.board,
  WHITE,
);
