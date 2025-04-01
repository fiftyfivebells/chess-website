import { Box } from "@mui/material";
import { Chessboard } from "react-chessboard";
import { getBoardFenRep, printBoard } from "../utils/Board";
import { useChessContext } from "../context/ChessGameContext";

export default function ChessGame() {
  const { gameState } = useChessContext();

  printBoard(gameState.board);

  return (
    <>
      <Box width={650}>
        <Chessboard position={getBoardFenRep(gameState.board)} />
      </Box>
    </>
  );
}
