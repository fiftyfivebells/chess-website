import { Container, Grid } from "@mui/material";
import { Chessboard } from "react-chessboard";
import { useChessContext } from "../context/ChessGameContext";
import { GameStatus, PieceType, Square } from "../models/types";
import { getBoardFenRep, getPieceAtSquare } from "../utils/Board";
import { ChessGameInfo } from "./ChessGameInfo";
import { ACTIVE, CHECK, CHECKMATE, DRAW, STALEMATE } from "../models/constants";
import { CapturedPieces } from "./CapturedPieces";

export default function ChessGame() {
  const { gameState, isValidMove, applyMove } = useChessContext();
  //("rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQk - 3 1");

  //  printBoard(gameState.board);

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

    console.log(move);
    if (isValidMove(move)) {
      return applyMove(move);
    }

    return false;
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 3 }}>
          <CapturedPieces whiteCaptured={[]} blackCaptured={[]} />
        </Grid>

        <Grid size={{ xs: 12, md: 3 }}>
          <Chessboard
            position={getBoardFenRep(gameState.board)}
            onPieceDrop={onDrop}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 3 }}>
          <ChessGameInfo
            activeSide={gameState.activeSide}
            gameStatus={getGameStatus()}
            whiteTime={10}
            blackTime={10}
            paused={false}
          />
        </Grid>
      </Grid>
    </Container>
  );

  /* return (
   *   <>
   *     <Box sx={{ flexGrow: 1, p: 2, maxWidth: 1000, margin: "auto" }}>
   *       <Grid container spacing={2} alignItems="center" justifyContent="center">
   *         <Grid size={{ xs: 12, md: 6, lg: 8 }}>
   *           <Box
   *             sx={{
   *               width: "100%", // Take full width of the Grid item
   *               maxWidth: 700, // Max size for the board container itself
   *               margin: "auto", // Center the Box if Grid item is wider
   *               aspectRatio: "1 / 1", // Maintain square shape for the board area
   *               position: "relative", // Needed if using absolute positioning inside
   *             }}
   *           >
   *             <Chessboard
   *               position={getBoardFenRep(gameState.board)}
   *               onPieceDrop={onDrop}
   *             />
   *           </Box>
   *         </Grid>
   *         <Grid size={4}>
   *           <ChessGameInfo
   *             activeColor={gameState.activeSide}
   *             gameStatus={getGameStatus()}
   *             whiteTime={10}
   *             blackTime={10}
   *             paused={false}
   *           />
   *         </Grid>
   *       </Grid>
   *     </Box>
   *   </>
   * ); */
}
