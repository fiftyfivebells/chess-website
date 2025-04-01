import { createBoardFromFen } from "../utils/Board";
import { Color, Move, PieceType } from "./types";

export const WHITE: Color = "white";
export const BLACK: Color = "black";

export const PAWN: PieceType = "p";
export const KNIGHT: PieceType = "n";
export const BISHOP: PieceType = "b";
export const ROOK: PieceType = "r";
export const QUEEN: PieceType = "q";
export const KING: PieceType = "k";

export const INITIAL_STATE_FEN =
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 0";

export const INITIAL_GAME_STATE = {
  board: createBoardFromFen(INITIAL_STATE_FEN),
  activeSide: WHITE,
  fullMoveCount: 1,
  rule50: 0,
  moveHistory: [] as Move[],
  isCheck: false,
  isCheckmate: false,
  isStalemate: false,
  isDraw: false,
};
