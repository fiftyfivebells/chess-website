export type Color = "white" | "black";
export const WHITE: Color = "white";
export const BLACK: Color = "black";

export type PieceType = "p" | "n" | "b" | "r" | "q" | "k";
export const PAWN: PieceType = "p";
export const KNIGHT: PieceType = "n";
export const BISHOP: PieceType = "b";
export const ROOK: PieceType = "r";
export const QUEEN: PieceType = "q";
export const KING: PieceType = "k";

export type Piece = {
  color: Color;
  pieceType: PieceType;
};
