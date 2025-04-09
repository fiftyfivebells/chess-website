import { Box } from "@mui/material";
import { Chessboard } from "react-chessboard";
import { useChessContext } from "../context/ChessGameContext";
import { Square } from "../models/types";
import { getBoardFenRep } from "../utils/Board";

export default function ChessGame() {
  const { gameState, isValidMove, applyMove } = useChessContext();
  //("rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQk - 3 1");

  //  printBoard(gameState.board);

  function onDrop(sourceSquare: Square, targetSquare: Square): boolean {
    const move = {
      from: sourceSquare,
      to: targetSquare,
    };

    if (isValidMove(move)) {
      return applyMove(move);
    }

    return false;
  }

  return (
    <>
      <Box width={650}>
        <Chessboard
          position={getBoardFenRep(gameState.board)}
          onPieceDrop={onDrop}
        />
      </Box>
    </>
  );
}
