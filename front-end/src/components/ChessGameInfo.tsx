import { Chip, Paper, Typography } from "@mui/material";
import { Color, GameStatus } from "../models/types";
import { Box } from "@mui/system";
import { BLACK, WHITE } from "../models/constants";

interface ChessGameInfoProps {
  activeSide: Color;
  gameStatus: GameStatus;
  whiteTime: number;
  blackTime: number;
  paused: boolean;
}

export function ChessGameInfo({
  activeSide,
  gameStatus,
  whiteTime,
  blackTime,
  paused,
}: ChessGameInfoProps) {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getGameStatusInfo = (status: GameStatus) => {
    const statusMap = {
      active: { label: "In Progress", color: "info" },
      check: { label: "Check!", color: "warning" },
      checkmate: { label: "Checkmate", color: "error" },
      stalemate: { label: "Stalemate", color: "secondary" },
      draw: { label: "Draw", color: "secondary" },
    };

    return statusMap[status] || statusMap["active"];
  };

  const gameStatusInfo = getGameStatusInfo(gameStatus);

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
      <Typography variant="h5" gutterBottom fontWeight="bold">
        Game Info
      </Typography>

      <Box mb={2}>
        <Typography variant="subtitle1" gutterBottom>
          Status
        </Typography>
        <Chip
          label={gameStatusInfo.label}
          color={gameStatusInfo.color as any}
          sx={{ fontWeight: "bold" }}
        />
      </Box>

      <Box mb={2}>
        <Typography variant="subtitle1" gutterBottom>
          Current Turn
        </Typography>
        <Chip
          label={activeSide === WHITE ? "White to Move" : "Black to Move"}
          color={activeSide === WHITE ? "default" : "primary"}
          sx={{
            fontWeight: "bold",
            backgroundColor: activeSide === "white" ? "#f5f5f5" : "#263238",
          }}
        />
      </Box>

      <Box>
        <Box
          mb={1}
          display="flex"
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography variant="subtitle1">White</Typography>
          <Typography
            variant="h6"
            fontFamily="monospace"
            fontWeight={activeSide === WHITE ? "bold" : "normal"}
          >
            {formatTime(whiteTime)}
          </Typography>
        </Box>

        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="subtitle1">Black</Typography>
          <Typography
            variant="h6"
            fontFamily="monospace"
            fontWeight={activeSide === BLACK ? "bold" : "normal"}
          >
            {formatTime(blackTime)}
          </Typography>
        </Box>
      </Box>

      {paused && (
        <Chip
          label="Game Paused"
          color="warning"
          sx={{ alignSelf: "center", mt: 2 }}
        />
      )}
    </Paper>
  );
}
