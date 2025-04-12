import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormLabel,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Select,
  SelectChangeEvent,
  Stack,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { Chessboard } from "react-chessboard";
import { useChessContext } from "../context/ChessGameContext";
import {
  ACTIVE,
  BLACK,
  CHECK,
  CHECKMATE,
  DRAW,
  GO,
  STALEMATE,
  STOCKFISH,
  WHITE,
} from "../models/constants";
import {
  Color,
  Engine,
  EngineName,
  GameConfig,
  GameStatus,
  PieceType,
  Square,
  TimeControl,
} from "../models/types";
import { getBoardFenRep, getPieceAtSquare } from "../utils/Board";
import { CapturedPieces } from "./CapturedPieces";
import { ChessGameInfo } from "./ChessGameInfo";
import { useEffect, useState } from "react";
import { BoardOrientation } from "react-chessboard/dist/chessboard/types";

const engineOptions = {
  go: GO,
  stockfish: STOCKFISH,
} as Record<string, Engine>;
const defaultEngine: EngineName = STOCKFISH.name;

const timeControlOptions = {
  bullet10: { initialTime: 1, increment: 0 },
  bullet21: { initialTime: 2, increment: 1 },
  blitz30: { initialTime: 3, increment: 0 },
  blitz32: { initialTime: 3, increment: 2 },
  blitz50: { initialTime: 5, increment: 0 },
  blitz53: { initialTime: 5, increment: 3 },
  rapid100: { initialTime: 10, increment: 0 },
  rapid105: { initialTime: 10, increment: 5 },
  rapid1510: { initialTime: 15, increment: 10 },
  classical300: { initialTime: 30, increment: 0 },
  classical3020: { initialTime: 30, increment: 20 },
} as Record<string, TimeControl>;
const defaultTimeControl: string = "rapid1510";

function makeTimeControlLabel(timeControl: TimeControl): string {
  let gameType;
  if (timeControl.initialTime < 3) gameType = "Bullet";
  else if (timeControl.initialTime < 10) gameType = "Blitz";
  else if (timeControl.initialTime < 30) gameType = "Rapid";
  else gameType = "Classical";

  return `${gameType} ${timeControl.initialTime} | ${timeControl.increment}`;
}

// TODO: add a game-over modal that shows the user the game is over and why it ended
export default function ChessGame() {
  const {
    applyMove,
    gameState,
    isGameActive,
    isPaused,
    isValidMove,
    resetGame,
    startGame,
    timers,
    togglePaused,
  } = useChessContext();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSide, setSelectedSide] = useState<string>("white");
  const [selectedEngine, setSelectedEngine] =
    useState<EngineName>(defaultEngine);
  const [selectedTimeControl, setSelectedTimeControl] =
    useState<string>(defaultTimeControl);

  // --- Effect to open modal on initial load or when game is reset ---
  useEffect(() => {
    if (!isGameActive) {
      setIsModalOpen(true);
    }
  }, [isGameActive]);

  // Handlers for the values set by the modal
  const handleSideChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedSide = (event.target as HTMLInputElement).value;

    setSelectedSide(selectedSide);
  };

  const handleEngineChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const engine = (event.target as HTMLInputElement).value;

    setSelectedEngine(engine as EngineName);
  };

  const handleTimeControlChange = (event: SelectChangeEvent) => {
    const timeControl = event.target.value as string;

    setSelectedTimeControl(timeControl);
  };

  const handleStartGame = () => {
    const colors = [WHITE, BLACK];
    const playerColor: Color =
      selectedSide === "random"
        ? colors[Math.floor(Math.random() * 2)]
        : (selectedSide as Color);

    const config: GameConfig = {
      engine: engineOptions[selectedEngine].name,
      timeControl: timeControlOptions[selectedTimeControl],
      playerColor: playerColor,
    };
    console.log("Starting game with config:", config);
    startGame(config);
    setIsModalOpen(false);
  };

  // button handlers
  const handleReset = () => {
    console.log("Game is resetting");
    resetGame();
  };

  const handlePauseButton = () => {
    console.log("Toggling paused state");
    togglePaused();
  };

  const onDrop = (
    sourceSquare: Square,
    targetSquare: Square,
    piece: string,
  ): boolean => {
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
  };

  const getGameStatus = (): GameStatus => {
    if (gameState.isCheckmate) return CHECKMATE;
    if (gameState.isCheck) return CHECK;
    if (gameState.isStalemate) return STALEMATE;
    if (gameState.isDraw) return DRAW;

    return ACTIVE;
  };

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
                arePiecesDraggable={!isPaused}
                boardOrientation={
                  // only flip the board once the game has actually started
                  isGameActive ? (selectedSide as BoardOrientation) : "white"
                }
              />
            </Paper>
            <Stack
              direction="row"
              spacing={2}
              justifyContent="center"
              sx={{ padding: "10px" }}
            >
              <Button
                variant="outlined"
                onClick={handleReset}
                disabled={!isGameActive} // Disable if game hasn't started yet
                sx={{
                  padding: { xs: "4px 8px", sm: "5px 10px", md: "6px 16px" },
                  fontSize: { xs: "0.7rem", sm: "0.8rem", md: "0.875rem" }, // Adjust values as needed
                  whiteSpace: "nowrap",
                  minWidth: "auto",
                }}
              >
                Reset Game
              </Button>
              <Button
                variant="contained"
                onClick={handlePauseButton}
                disabled={
                  !isGameActive ||
                  gameState.isCheckmate ||
                  gameState.isDraw ||
                  gameState.isStalemate
                } // Disable if not started or game over
                color={isPaused ? "secondary" : "primary"}
                sx={{
                  padding: { xs: "4px 8px", sm: "5px 10px", md: "6px 16px" },
                  fontSize: { xs: "0.7rem", sm: "0.8rem", md: "0.875rem" }, // Adjust values as needed
                  whiteSpace: "nowrap",
                  minWidth: "auto",
                }}
              >
                {isPaused ? "Resume" : "Pause"}
              </Button>
            </Stack>
          </Box>
        </Grid>
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
              whiteTime={timers.white}
              blackTime={timers.black}
              paused={false}
            />
          </Paper>
        </Grid>
      </Grid>
      {/* --- Game Setup Modal --- */}
      <Dialog
        open={isModalOpen}
        onClose={(_, reason) => {
          // Prevent closing by clicking backdrop or escape key before game starts
          if (
            reason &&
            (reason === "backdropClick" || reason === "escapeKeyDown") &&
            !isGameActive
          ) {
            return;
          }
          // Allow closing if game has started (e.g., user resets then closes)
          // Although usually reset should keep it open until Start is clicked again
          setIsModalOpen(false);
        }}
        aria-labelledby="game-setup-dialog-title"
        disableEscapeKeyDown={!isGameActive} // Prevent Esc key close before first start
      >
        <DialogTitle id="game-setup-dialog-title">Game Setup</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ pt: 1 }}>
            {" "}
            {/* Add padding top */}
            {/* Side Selection */}
            <FormControl component="fieldset">
              <FormLabel component="legend">Play as</FormLabel>
              <RadioGroup
                row
                aria-label="play-as"
                name="side-selection"
                value={selectedSide}
                onChange={handleSideChange}
              >
                <FormControlLabel
                  value="white"
                  control={<Radio />}
                  label="White"
                />
                <FormControlLabel
                  value="black"
                  control={<Radio />}
                  label="Black"
                />
                <FormControlLabel
                  value="random"
                  control={<Radio />}
                  label="Random"
                />
              </RadioGroup>
            </FormControl>
            {/* Engine Selection */}
            <FormControl component="fieldset">
              <FormLabel component="legend">Opponent Engine</FormLabel>
              <RadioGroup
                row
                aria-label="engine-select"
                name="engine-selection"
                value={selectedEngine as string}
                onChange={handleEngineChange}
              >
                {Object.entries(engineOptions).map(([key, engine]) => (
                  <FormControlLabel
                    key={engine.name}
                    value={key}
                    control={<Radio />}
                    label={engine.label}
                  />
                ))}
              </RadioGroup>
            </FormControl>
            {/* Time Control Selection */}
            <FormControl fullWidth>
              <InputLabel id="time-control-select-label">
                Time Control
              </InputLabel>
              <Select
                labelId="time-control-select-label"
                id="time-control-select"
                value={selectedTimeControl}
                label="Time Control"
                onChange={handleTimeControlChange}
              >
                {Object.entries(timeControlOptions).map(
                  ([key, timeControl]) => (
                    <MenuItem key={key} value={key}>
                      {makeTimeControlLabel(timeControl)}
                    </MenuItem>
                  ),
                )}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleStartGame} variant="contained">
            Start Game
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
