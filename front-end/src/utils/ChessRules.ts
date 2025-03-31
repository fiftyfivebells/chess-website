export type Color = "white" | "black";
export const WHITE: Color = "white";
export const BLACK: Color = "black";

export type PieceType =
  | "pawn"
  | "knight"
  | "bishop"
  | "rook"
  | "queen"
  | "king";
export const PAWN: PieceType = "pawn";
export const KNIGHT: PieceType = "knight";
export const BISHOP: PieceType = "bishop";
export const ROOK: PieceType = "rook";
export const QUEEN: PieceType = "queen";
export const KING: PieceType = "king";

export type Piece = {
  color: Color;
  pieceType: PieceType;
};
