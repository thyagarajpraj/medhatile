import type { Board } from "@medhatile/shared-types";

type Direction = "up" | "down" | "left" | "right";

function cloneBoard(board: Board): Board {
  return board.map((row) => [...row]);
}

function slideRowLeft(row: number[]): number[] {
  const compact = row.filter((value) => value !== 0);
  const merged: number[] = [];

  for (let index = 0; index < compact.length; index += 1) {
    const current = compact[index];
    const next = compact[index + 1];

    if (current !== 0 && current === next) {
      merged.push(current * 2);
      index += 1;
    } else {
      merged.push(current);
    }
  }

  while (merged.length < row.length) {
    merged.push(0);
  }

  return merged;
}

function transpose(board: Board): Board {
  return board[0].map((_, columnIndex) => board.map((row) => row[columnIndex]));
}

function reverseRows(board: Board): Board {
  return board.map((row) => [...row].reverse());
}

function normalizeForLeftMove(board: Board, direction: Direction): Board {
  if (direction === "left") {
    return cloneBoard(board);
  }

  if (direction === "right") {
    return reverseRows(board);
  }

  if (direction === "up") {
    return transpose(board);
  }

  return reverseRows(transpose(board));
}

function denormalizeFromLeftMove(board: Board, direction: Direction): Board {
  if (direction === "left") {
    return cloneBoard(board);
  }

  if (direction === "right") {
    return reverseRows(board);
  }

  if (direction === "up") {
    return transpose(board);
  }

  return transpose(reverseRows(board));
}

export function createBoard(size = 4): Board {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => 0));
}

export function spawnTile(board: Board): Board {
  const nextBoard = cloneBoard(board);
  const emptyCells: Array<[number, number]> = [];

  nextBoard.forEach((row, rowIndex) => {
    row.forEach((value, columnIndex) => {
      if (value === 0) {
        emptyCells.push([rowIndex, columnIndex]);
      }
    });
  });

  if (emptyCells.length === 0) {
    return nextBoard;
  }

  const [rowIndex, columnIndex] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  nextBoard[rowIndex][columnIndex] = Math.random() < 0.9 ? 2 : 4;
  return nextBoard;
}

export function mergeTiles(board: Board): Board {
  return board.map((row) => slideRowLeft(row));
}

export function moveTiles(board: Board, direction: Direction): Board {
  const preparedBoard = normalizeForLeftMove(board, direction);
  const movedBoard = mergeTiles(preparedBoard);
  return denormalizeFromLeftMove(movedBoard, direction);
}

export function calculateScore(board: Board): number {
  return board.flat().reduce((total, value) => total + value, 0);
}

export function checkGameOver(board: Board): boolean {
  for (let rowIndex = 0; rowIndex < board.length; rowIndex += 1) {
    for (let columnIndex = 0; columnIndex < board[rowIndex].length; columnIndex += 1) {
      const value = board[rowIndex][columnIndex];

      if (value === 0) {
        return false;
      }

      const right = board[rowIndex][columnIndex + 1];
      const down = board[rowIndex + 1]?.[columnIndex];

      if (right === value || down === value) {
        return false;
      }
    }
  }

  return true;
}

export function boardsAreEqual(left: Board, right: Board): boolean {
  return left.every((row, rowIndex) => row.every((value, columnIndex) => value === right[rowIndex]?.[columnIndex]));
}

export function createStartingBoard(size = 4): Board {
  return spawnTile(spawnTile(createBoard(size)));
}
