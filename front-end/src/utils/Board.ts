import {
  BISHOP,
  BLACK,
  Color,
  KING,
  KNIGHT,
  PAWN,
  Piece,
  PieceType,
  QUEEN,
  ROOK,
  WHITE,
} from "./ChessRules";
import { INITIAL_FEN } from "./GameState";

// prettier-ignore
export type Square =
    'a8' | 'b8' | 'c8' | 'd8' | 'e8' | 'f8' | 'g8' | 'h8' |
    'a7' | 'b7' | 'c7' | 'd7' | 'e7' | 'f7' | 'g7' | 'h7' |
    'a6' | 'b6' | 'c6' | 'd6' | 'e6' | 'f6' | 'g6' | 'h6' |
    'a5' | 'b5' | 'c5' | 'd5' | 'e5' | 'f5' | 'g5' | 'h5' |
    'a4' | 'b4' | 'c4' | 'd4' | 'e4' | 'f4' | 'g4' | 'h4' |
    'a3' | 'b3' | 'c3' | 'd3' | 'e3' | 'f3' | 'g3' | 'h3' |
    'a2' | 'b2' | 'c2' | 'd2' | 'e2' | 'f2' | 'g2' | 'h2' |
    'a1' | 'b1' | 'c1' | 'd1' | 'e1' | 'f1' | 'g1' | 'h1' |
    'oob' // oob = out of bounds

export const [A8, H1] = [22, 99]; // these are the indices first and last board squares in the mailbox representation

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

//In the Mailbox Board, there is a 2 space buffer around the actual chess board to
// make it more clear when a move goes outside the boundary of the board. This means
// that the first index in the actual board doesn't start until the 22nd index in
// the overall array. Example:
//
// ############
// ############
// ##OOOOOOOO##      22
// ##OOOOOOOO##      32
// ##OOOOOOOO##
// ##OOOOOOOO##
// ##OOOOOOOO##
// ##OOOOOOOO##
// ##OOOOOOOO##
// ##OOOOOOOO##
// ############
// ############
//
// O represents a square in the chess board, while # is an out of bounds spot. This
// will make it easier to detect when a move has gone off the board (and is therefore
// not a legal move)
export class Board {
  private _mailbox: Array<Piece | null> = Array(120).fill(null);

  constructor(fen = INITIAL_FEN) {
    this._mailbox = this.setBoardFromFen(fen);
  }

  showBoard(): void {
    console.log(this._mailbox);
  }

  setBoardFromFen(fen: string = INITIAL_FEN): (Piece | null)[] {
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

  getBoardFenRep(): string {
    const getChessBoard = (mailbox: (Piece | null)[]): (Piece | null)[][] => {
      const mainBoard = mailbox.slice(20, 100);

      const rankList = mainBoard.reduce(
        (acc, _, index) => {
          if (index % 10 === 0) acc.push(mainBoard.slice(index, index + 10));

          return acc;
        },
        [] as (Piece | null)[][],
      );

      return rankList.map((rank) => rank.slice(2));
    };

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

          const totalBlanks = blanks > 0 ? `${blanks}` : "";

          return {
            rowString: `${rowString}${piece.pieceType}${totalBlanks}`,
            blanks: 0,
          };
        },
        { rowString: "", blanks: 0 } as Accumulator,
      ).rowString;
    };

    const chessBoard = getChessBoard(this._mailbox);

    const fen = chessBoard.map((row) => processBoardRow(row));

    return fen.join("/");
  }
}
