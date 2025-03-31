import { Box } from "@mui/material";
import { Chessboard } from "react-chessboard";
import { Board } from "../utils/Board";

export default function ChessBoard() {
  const b = new Board()

  b.showBoard

  console.log(b)

  return (
    <>
      <Box width={650}>
        <Chessboard
          position={
            "r1bqkbnr/pppppppp/n7/8/8/P7/1PPPPPPP/RNBQKBNR w KQkq - 2 2"
          }
        />
      </Box>
    </>
  );
}
