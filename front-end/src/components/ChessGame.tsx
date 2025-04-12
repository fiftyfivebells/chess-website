import { Box, Grid, Paper, useMediaQuery, useTheme } from "@mui/material";
import { Chessboard } from "react-chessboard";
import { useChessContext } from "../context/ChessGameContext";
import {
  ACTIVE,
  BLACK,
  CHECK,
  CHECKMATE,
  DRAW,
  STALEMATE,
  WHITE,
} from "../models/constants";
import { GameStatus, PieceType, Square } from "../models/types";
import { getBoardFenRep, getPieceAtSquare } from "../utils/Board";
import { CapturedPieces } from "./CapturedPieces";
import { ChessGameInfo } from "./ChessGameInfo";

export default function ChessGame() {
  const { gameState, isValidMove, applyMove } = useChessContext();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));

  function getGameStatus(): GameStatus {
    if (gameState.isCheckmate) return CHECKMATE;
    if (gameState.isCheck) return CHECK;
    if (gameState.isStalemate) return STALEMATE;
    if (gameState.isDraw) return DRAW;

    return ACTIVE;
  }

  function onDrop(
    sourceSquare: Square,
    targetSquare: Square,
    piece: string,
  ): boolean {
    const movingPiece = getPieceAtSquare(gameState.board, sourceSquare);
    const destinationPiece = piece[1].toLowerCase();
    const promotionPiece =
      destinationPiece !== movingPiece?.pieceType
        ? (destinationPiece as PieceType)
        : undefined;

    const move = {
      from: sourceSquare,
      to: targetSquare,
      promotion: promotionPiece,
    };

    if (isValidMove(move)) {
      return applyMove(move);
    }

    return false;
  }

  const capturedPiecesOrder = isSmallScreen ? 3 : 1;
  const boardOrder = isSmallScreen ? 1 : 2;
  const chessGameInfoOrder = isSmallScreen ? 2 : 3;

  return (
    <Box
      sx={{
        flexGrow: 1,
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
      }}
    >
      <Grid
        container
        spacing={2}
        alignItems="center"
        justifyContent="center"
        sx={{ width: "100%", maxWidth: "1600px" }}
      >
        {/* Captured Pieces (Left or Third on Small Screen) */}
        <Grid size={{ xs: 12, md: 2 }} order={capturedPiecesOrder}>
          <Paper elevation={1} sx={{ padding: 1 }}>
            <CapturedPieces
              whiteCaptured={gameState.capturedPieces[WHITE]}
              blackCaptured={gameState.capturedPieces[BLACK]}
            />
          </Paper>
        </Grid>

        {/* Chessboard (Middle or First on Small Screen) */}
        <Grid
          size={{ xs: 12, md: 8 }}
          order={boardOrder}
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            maxHeight: "90vh",
          }} // Center board
        >
          {/* Ensure the board itself is responsive within its container */}
          {/* react-chessboard usually handles its own sizing well based on container width */}
          <Box sx={{ width: "100%", maxWidth: "70vh", aspectRatio: "1 / 1" }}>
            {/* Control max size & aspect ratio */}
            <Paper elevation={1} sx={{ padding: 1 }}>
              <Chessboard
                position={getBoardFenRep(gameState.board)}
                onPieceDrop={onDrop}
                // Add other props as needed: arePiecesDraggable, custom pieces, etc.
              />
            </Paper>
          </Box>
        </Grid>

        {/* Game Info (Right or Second on Small Screen) */}
        <Grid
          size={{ xs: 12, md: 2 }}
          order={chessGameInfoOrder}
          sx={{ height: false ? "auto" : "80%" }} // Adjust height
        >
          <Paper
            elevation={1}
            sx={{ padding: 1, minHeight: "25%", minWidth: "300px" }}
          >
            <ChessGameInfo
              activeSide={gameState.activeSide}
              gameStatus={getGameStatus()}
              whiteTime={10}
              blackTime={10}
              paused={false}
            />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
