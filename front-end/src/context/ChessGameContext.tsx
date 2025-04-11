import { createContext, ReactNode, useContext } from "react";
import { useChessGame } from "../hooks/useChessGame";
import { GameState, Move } from "../models/types";

interface ChessGameContextType {
  gameState: GameState;
  applyMove: (move: Move) => boolean;
  isValidMove: (move: Move) => boolean;
  getFen: () => void;
}

const ChessGameContext = createContext<ChessGameContextType | undefined>(
  undefined,
);

export function ChessGameProvider({ children }: { children: ReactNode }) {
  const chessGame = useChessGame();

  return (
    <ChessGameContext.Provider value={chessGame}>
      {children}
    </ChessGameContext.Provider>
  );
}

export function useChessContext() {
  const context = useContext(ChessGameContext);
  if (context === undefined) {
    throw new Error("useChessGame must be used within a ChessProvider");
  }
  return context;
}
