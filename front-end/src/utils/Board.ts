import { A8, Board, Color, Piece, PieceType, Square } from "../models/types";
import {
  BISHOP,
  BLACK,
  KING,
  KNIGHT,
  PAWN,
  QUEEN,
  ROOK,
  WHITE,
} from "../models/constants";
import { INITIAL_FEN } from "./GameState";

function squareToFileRankIndex(square: Square): [number, number] {
  const files = "abcdefgh";
  const ranks = "12345678";

  const file = files.indexOf(square[0]);
  const rank = ranks.indexOf(square[1]);

  return [file, rank];
}

function fileRankToMailboxIndex(fileIndex: number, rankIndex: number): number {
  const rankOffset = 10;
  const newRankIndex = A8 + rankOffset * rankIndex;

  return newRankIndex + fileIndex;
}

function squareToMailboxIndex(square: Square): number {
  const [file, rank] = squareToFileRankIndex(square);

  return fileRankToMailboxIndex(file, rank);
}

export function createBoardFromFen(fen: string = INITIAL_FEN): Board {
  const [position] = fen.split(" ");

  return position
    .split("/")
    .reduce((board: Array<Piece | null>, rank: string, rankIndex: number) => {
      let file = 0;
      return rank
        .split("")
        .reduce((innerBoard: Array<Piece | null>, char: string) => {
          if (parseInt(char)) {
            file += parseInt(char);
            return innerBoard;
          } else {
            const color: Color = char.toLowerCase() === char ? BLACK : WHITE;
            const pieceType: PieceType = (
              {
                p: PAWN,
                n: KNIGHT,
                b: BISHOP,
                r: ROOK,
                q: QUEEN,
                k: KING,
              } as Record<string, PieceType>
            )[char.toLowerCase()];

            const mailboxIndex = fileRankToMailboxIndex(file, rankIndex);
            const newPiece = {
              color: color,
              pieceType: pieceType,
            } as Piece;

            file++;
            return innerBoard.map((piece, index) =>
              index === mailboxIndex ? newPiece : piece,
            );
          }
        }, board.slice());
    }, Array<Piece | null>(120).fill(null));
}

/**
 * @remarks
 * This method takes the mailbox board and turns it into something that is a little more straightforward
 * to use. It cuts the two buffer rows (20 elements each) off each end of the array, maps the array into
 * a nested structure where each row is a row in the chess board, and then removes the remaining padding
 * elements to give an 8 x 8 board where each element is either a Piece or empty.
 *
 * @param mailbox - the mailbox board representation for the chess game.
 *
 * @returns an Array<Piece | null> of length 8, each element being another Array<Piece | null>
 * */
function getChessBoard(mailbox: Board): (Piece | null)[][] {
  const mainBoard = mailbox.slice(20, 100);

  const rankList = mainBoard.reduce(
    (acc, _, index) => {
      if (index % 10 === 0) acc.push(mainBoard.slice(index, index + 10));

      return acc;
    },
    [] as (Piece | null)[][],
  );

  return rankList.map((rank) => rank.slice(2));
}

export function getBoardFenRep(mailbox: Board): string {
  const processBoardRow = (boardRow: (Piece | null)[]): string => {
    type Accumulator = {
      rowString: string;
      blanks: number;
    };

    return boardRow.reduce(
      (acc: Accumulator, piece: Piece | null) => {
        const { rowString, blanks } = acc;

        if (blanks === 7) return { rowString: "8", blanks: 8 };

        if (!piece) return { rowString: rowString, blanks: blanks + 1 };

        const totalBlanks: string = blanks > 0 ? `${blanks}` : "";
        const pieceChar: string =
          piece.color === WHITE
            ? piece.pieceType.toUpperCase()
            : piece.pieceType;

        return {
          rowString: `${rowString}${pieceChar}${totalBlanks}`,
          blanks: 0,
        };
      },
      { rowString: "", blanks: 0 } as Accumulator,
    ).rowString;
  };

  const chessBoard = getChessBoard(mailbox);

  const fen = chessBoard.map((row) => processBoardRow(row));

  return fen.join("/");
}

export function getPieceAtSquare(board: Board, square: Square): Piece | null {
  const mailboxIndex = squareToMailboxIndex(square);

  return board[mailboxIndex];
}

export function placeOnSquare(
  board: Board,
  square: Square,
  piece: Piece | null,
) {
  const mailboxIndex = squareToMailboxIndex(square);

  board[mailboxIndex] = piece;
}

export function printBoard(board: Board): void {
  const chessBoard = getChessBoard(board);

  const boardStrings = chessBoard.map((row, index) => {
    const rowString = row.reduce((acc: string, piece: Piece | null) => {
      const char = !piece ? ". " : `${piece.pieceType} `;
      return `${acc}${char}`;
    }, "");

    return `${index + 1}| ${rowString}`;
  });

  const totalBoard = boardStrings
    .concat("   ---------------")
    .concat("   a b c d e f g h\n");

  console.log(totalBoard.join("\n"));
}
