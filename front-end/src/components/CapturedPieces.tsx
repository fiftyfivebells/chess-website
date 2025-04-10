import { Box, Paper, Typography } from "@mui/material";
import { WHITE } from "../models/constants";
import { Piece, PieceType } from "../models/types";

const pieceValues: Record<PieceType, number> = {
  p: 1,
  n: 3,
  b: 3.5,
  r: 5,
  q: 9,
  k: 1000,
};

interface CapturedPieceProps {
  whiteCaptured: Piece[];
  blackCaptured: Piece[];
}

export function CapturedPieces({
  whiteCaptured,
  blackCaptured,
}: CapturedPieceProps) {
  const sortPieces = (pieces: Piece[]): Piece[] => {
    return [...pieces].sort(
      (a, b) => pieceValues[b.pieceType] - pieceValues[a.pieceType],
    );
  };

  const getPieceSymbol = (piece: Piece): string => {
    const isWhite = piece.color === WHITE;

    const pieceMap: Record<PieceType, string> = {
      k: isWhite ? "♔" : "♚",
      q: isWhite ? "♕" : "♛",
      r: isWhite ? "♖" : "♜",
      b: isWhite ? "♗" : "♝",
      n: isWhite ? "♘" : "♞",
      p: isWhite ? "♙" : "♟",
    };

    return pieceMap[piece.pieceType] || "";
  };

  const renderPiece = (piece: Piece, index: number) => {
    const pieceChar = getPieceSymbol(piece);

    return (
      <Typography
        key={index}
        component="span"
        variant="h5"
        sx={{
          mx: 0.5,
          color: piece.color === WHITE ? "grey.700" : "grey.900",
          fontFamily: "Chess",
        }}
      >
        {pieceChar}
      </Typography>
    );
  };

  return (
    <Paper
      elevation={2}
      sx={{
        p: 2,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <Box>
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          Captured by Black
        </Typography>
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            minHeight: "2rem",
            alignItems: "center",
          }}
        >
          {sortPieces(whiteCaptured).map(renderPiece)}
        </Box>
      </Box>

      <Box>
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          Captured by White
        </Typography>
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            minHeight: "2rem",
            alignItems: "center",
          }}
        >
          {sortPieces(blackCaptured).map(renderPiece)}
        </Box>
      </Box>
    </Paper>
  );
}
