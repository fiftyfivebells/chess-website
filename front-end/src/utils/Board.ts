import { A8, Board, Color, Piece, PieceType, Square } from "../models/types";
import {
  N,
  E,
  S,
  W,
  BISHOP,
  BLACK,
  INITIAL_STATE_FEN,
  KING,
  KNIGHT,
  PAWN,
  QUEEN,
  ROOK,
  WHITE,
} from "../models/constants";

export function squareToFileRankIndex(square: Square): [number, number] {
  const files = "abcdefgh";
  const ranks = "87654321";

  const file = files.indexOf(square[0]);
  const rank = ranks.indexOf(square[1]);

  return [file, rank];
}

export function fileRankToMailboxIndex(
  fileIndex: number,
  rankIndex: number,
): number {
  const rankOffset = 10;
  const newRankIndex = A8 + rankOffset * rankIndex;

  return newRankIndex + fileIndex;
}

export function squareToMailboxIndex(square: Square): number {
  const [file, rank] = squareToFileRankIndex(square);

  return fileRankToMailboxIndex(file, rank);
}

export function mailboxIndexToSquare(mailboxIndex: number): Square {
  if (mailboxIndex < 22 || mailboxIndex > 99) return "oob";

  const files = "abcdefgh";
  const ranks = "87654321";

  const quotient = Math.floor((mailboxIndex - 20) / 10);
  const remainder = (mailboxIndex - 2) % 10;

  return remainder > 7
    ? "oob"
    : (`${files[remainder]}${ranks[quotient]}` as Square);
}

export function createBoardFromFen(fen: string = INITIAL_STATE_FEN): Board {
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
      (acc: Accumulator, piece: Piece | null, index: number) => {
        const { rowString, blanks } = acc;

        if (index == 7 && !piece) {
          return {
            rowString: `${rowString}${blanks + 1}`,
            blanks: 0,
          };
        }

        //        if (blanks === 7 && !piece) return { rowString: "8", blanks: 8 };

        if (!piece) return { rowString: rowString, blanks: blanks + 1 };

        const totalBlanks: string = blanks > 0 ? `${blanks}` : "";
        const pieceChar: string =
          piece.color === WHITE
            ? piece.pieceType.toUpperCase()
            : piece.pieceType;

        return {
          rowString: `${rowString}${totalBlanks}${pieceChar}`,
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

export function isValidDestination(
  board: Board,
  start: Square,
  offset: number,
  activeSide: Color,
): boolean {
  const mailboxIndex: number = squareToMailboxIndex(start) + offset;

  const target: Piece | null = board[mailboxIndex];

  const square = mailboxIndexToSquare(mailboxIndex);

  return square !== "oob" && (target === null || target.color !== activeSide);
}

export function isValidPawnAttack(
  board: Board,
  start: Square,
  offset: number,
  activeSide: Color,
  epSquare?: Square,
): boolean {
  const validDestination = isValidDestination(board, start, offset, activeSide);

  const mailboxIndex: number = squareToMailboxIndex(start) + offset;
  const target: Piece | null = board[mailboxIndex];
  const targetSquare: Square = mailboxIndexToSquare(mailboxIndex);

  // this function returns true if the destination is valid, and the piece at the destination
  // is not null OR the target destination happens to be the en passant square
  return (
    validDestination && (!!target || (!!epSquare && epSquare === targetSquare))
  );
}

export function isPawnStartingRank(square: Square, piece: Piece): boolean {
  if (piece.pieceType !== PAWN) return false;

  const [_, rank] = squareToFileRankIndex(square);

  return piece.color === BLACK ? rank === 1 : rank === 6;
}

export function isLastRank(square: Square, activeSide: Color): boolean {
  const [rank] = squareToFileRankIndex(square);

  return activeSide === BLACK ? rank === 0 : rank === 7;
}

export function isKingUnderAttack(board: Board, activeSide: Color): boolean {
  const kingIndex = board.findIndex(
    (p) => p?.color === activeSide && p.pieceType === KING,
  );
  const kingSquare = mailboxIndexToSquare(kingIndex);

  return isSquareUnderAttack(board, kingSquare, activeSide);
}

export function isSquareUnderAttack(
  board: Board,
  square: Square,
  activeSide: Color,
): boolean {
  return (
    pawnAttacksSquare(board, square, activeSide) ||
    knightAttacksSquare(board, square, activeSide) ||
    diagonalPieceAttacksSquare(board, square, activeSide) ||
    straightPieceAttacksSquare(board, square, activeSide)
  );
}

function pawnAttacksSquare(
  board: Board,
  square: Square,
  activeSide: Color,
): boolean {
  const pawnAttacks = {
    white: [N + W, N + E],
    black: [S + W, S + E],
  } as Record<Color, number[]>;

  const enemyColor = activeSide === WHITE ? BLACK : WHITE;
  const mailboxIndex = squareToMailboxIndex(square);

  const doesAttack = pawnAttacks[activeSide].reduce((acc, attack) => {
    const target = board[mailboxIndex + attack];

    if (target && target.color === enemyColor && target.pieceType === PAWN)
      return true || acc;

    return acc;
  }, false);

  return doesAttack;
}

function knightAttacksSquare(
  board: Board,
  square: Square,
  activeSide: Color,
): boolean {
  const knightDirections = [
    N + N + E,
    E + E + N,
    E + E + S,
    S + S + E,
    S + S + W,
    W + W + S,
    W + W + N,
    N + N + W,
  ];

  const enemyColor = activeSide === WHITE ? BLACK : WHITE;
  const mailboxIndex = squareToMailboxIndex(square);

  const doesAttack = knightDirections.reduce((acc, direction) => {
    const target = board[mailboxIndex + direction];

    if (target && target.color === enemyColor && target.pieceType === KNIGHT) {
      return acc || true;
    }

    return acc;
  }, false);

  return doesAttack;
}

function diagonalPieceAttacksSquare(
  board: Board,
  square: Square,
  activeSide: Color,
): boolean {
  const diagonals = [N + E, S + E, S + W, N + W];
  const diagonalPieces = new Set<PieceType>([BISHOP, QUEEN, KING]);

  return pieceAttacksSquareInDirection(
    board,
    square,
    activeSide,
    diagonals,
    diagonalPieces,
  );
}

function straightPieceAttacksSquare(
  board: Board,
  square: Square,
  activeSide: Color,
): boolean {
  const straights = [N, E, S, W];
  const straightPieces = new Set<PieceType>([ROOK, QUEEN, KING]);

  return pieceAttacksSquareInDirection(
    board,
    square,
    activeSide,
    straights,
    straightPieces,
  );
}

function pieceAttacksSquareInDirection(
  board: Board,
  square: Square,
  activeSide: Color,
  directions: number[],
  pieceTypes: Set<PieceType>,
): boolean {
  const enemyColor = activeSide === WHITE ? BLACK : WHITE;
  const mailboxIndex = squareToMailboxIndex(square);

  const doesAttack = directions.reduce((acc, direction) => {
    let nextIndex = mailboxIndex + direction;
    let nextSquare = mailboxIndexToSquare(nextIndex);
    while (nextSquare !== "oob" && !board[nextIndex]) {
      nextIndex += direction;
      nextSquare = mailboxIndexToSquare(nextIndex);
    }

    const target = board[nextIndex];
    if (
      target &&
      pieceTypes.has(target.pieceType) &&
      target.color === enemyColor
    )
      return acc || true;

    return acc;
  }, false);

  return doesAttack;
}

export function movePiece(board: Board, from: Square, to: Square): Board {
  const fromIndex = squareToMailboxIndex(from);
  const toIndex = squareToMailboxIndex(to);

  const newBoard = [...board];

  const movingPiece = board[fromIndex];
  const destinationPiece = board[toIndex];

  if (
    movingPiece &&
    destinationPiece &&
    movingPiece.color === destinationPiece.color
  ) {
    return newBoard;
  }

  newBoard[fromIndex] = null;
  newBoard[toIndex] = movingPiece;

  return newBoard;
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
