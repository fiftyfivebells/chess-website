// Basic types that make up a piece
export type Color = "white" | "black";
export type PieceType = "p" | "n" | "b" | "r" | "q" | "k";
export type Piece = {
  color: Color;
  pieceType: PieceType;
};

//In the Mailbox Board, there is a 2 space buffer around the actual chess board to
// make it more clear when a move goes outside the boundary of the board. This means
// that the first index in the actual board doesn't start until the 22nd index in
// the overall array. Example:
//
// ##########
// ##########
// #OOOOOOOO#
// #OOOOOOOO#
// #OOOOOOOO#
// #OOOOOOOO#
// #OOOOOOOO#
// #OOOOOOOO#
// #OOOOOOOO#
// #OOOOOOOO#
// ##########
// ##########
//
// O represents a square in the chess board, while # is an out of bounds spot. This
// will make it easier to detect when a move has gone off the board (and is therefore
// not a legal move)
export type Board = Array<Piece | null>;

// prettier-ignore
export type Square =
    'a8' | 'b8' | 'c8' | 'd8' | 'e8' | 'f8' | 'g8' | 'h8' |
    'a7' | 'b7' | 'c7' | 'd7' | 'e7' | 'f7' | 'g7' | 'h7' |
    'a6' | 'b6' | 'c6' | 'd6' | 'e6' | 'f6' | 'g6' | 'h6' |
    'a5' | 'b5' | 'c5' | 'd5' | 'e5' | 'f5' | 'g5' | 'h5' |
    'a4' | 'b4' | 'c4' | 'd4' | 'e4' | 'f4' | 'g4' | 'h4' |
    'a3' | 'b3' | 'c3' | 'd3' | 'e3' | 'f3' | 'g3' | 'h3' |
    'a2' | 'b2' | 'c2' | 'd2' | 'e2' | 'f2' | 'g2' | 'h2' |
    'a1' | 'b1' | 'c1' | 'd1' | 'e1' | 'f1' | 'g1' | 'h1' |
    'oob' // oob = out of bounds

export const [A8, H8, A1, H1] = [22, 29, 92, 99]; // these are the indices of the corners of the board in the mailbox representation

export interface Move {
  from: Square;
  to: Square;
  promotion?: PieceType;
}

export interface GameState {
  board: Board;
  activeSide: Color;
  epSquare?: Square;
  castleRights?: string;
  fullMoveCount: number;
  rule50: number;

  history: GameState[];
  isCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
  isDraw: boolean;
}
