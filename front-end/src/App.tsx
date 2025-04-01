import "./App.css";
import ChessGame from "./components/ChessGame";
import { ChessGameProvider } from "./context/ChessGameContext";

function App() {
  return (
    <ChessGameProvider>
      <ChessGame />
    </ChessGameProvider>
  );
}

export default App;
