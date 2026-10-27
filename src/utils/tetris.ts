import {
  ActivePiece,
  BoardGrid,
  BOARD_HEIGHT,
  BOARD_WIDTH,
  CellValue,
  Point,
  TETROMINOES,
  TetrominoType,
} from '../types/tetris';

// Create empty board
export function createEmptyBoard(): BoardGrid {
  return Array.from({ length: BOARD_HEIGHT }, () =>
    Array.from({ length: BOARD_WIDTH }, () => null)
  );
}

// 7-Bag Randomizer
export class BagRandomizer {
  private bag: TetrominoType[] = [];

  private refillBag() {
    const types: TetrominoType[] = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
    // Fisher-Yates shuffle
    for (let i = types.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [types[i], types[j]] = [types[j], types[i]];
    }
    this.bag = types;
  }

  public nextPiece(): TetrominoType {
    if (this.bag.length === 0) {
      this.refillBag();
    }
    return this.bag.pop()!;
  }

  public peekUpcoming(count: number): TetrominoType[] {
    while (this.bag.length < count) {
      const types: TetrominoType[] = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
      for (let i = types.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [types[i], types[j]] = [types[j], types[i]];
      }
      this.bag.unshift(...types);
    }
    // Bag pops from end, so upcoming are from the end downwards
    return this.bag.slice(-count).reverse();
  }
}

// Rotate matrix clockwise
export function rotateMatrixCW(matrix: number[][]): number[][] {
  const n = matrix.length;
  const result = Array.from({ length: n }, () => Array(n).fill(0));
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      result[c][n - 1 - r] = matrix[r][c];
    }
  }
  return result;
}

// Rotate matrix counter-clockwise
export function rotateMatrixCCW(matrix: number[][]): number[][] {
  const n = matrix.length;
  const result = Array.from({ length: n }, () => Array(n).fill(0));
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      result[n - 1 - c][r] = matrix[r][c];
    }
  }
  return result;
}

// Standard Wall Kick Offsets (SRS)
// JLSTZ kick data for rotations: 0->1, 1->2, 2->3, 3->0
const JLSTZ_WALL_KICKS: Record<string, Point[]> = {
  '0->1': [{ x: 0, y: 0 }, { x: -1, y: 0 }, { x: -1, y: -1 }, { x: 0, y: 2 }, { x: -1, y: 2 }],
  '1->0': [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: -2 }, { x: 1, y: -2 }],
  '1->2': [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: -2 }, { x: 1, y: -2 }],
  '2->1': [{ x: 0, y: 0 }, { x: -1, y: 0 }, { x: -1, y: -1 }, { x: 0, y: 2 }, { x: -1, y: 2 }],
  '2->3': [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: -1 }, { x: 0, y: 2 }, { x: 1, y: 2 }],
  '3->2': [{ x: 0, y: 0 }, { x: -1, y: 0 }, { x: -1, y: 1 }, { x: 0, y: -2 }, { x: -1, y: -2 }],
  '3->0': [{ x: 0, y: 0 }, { x: -1, y: 0 }, { x: -1, y: 1 }, { x: 0, y: -2 }, { x: -1, y: -2 }],
  '0->3': [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: -1 }, { x: 0, y: 2 }, { x: 1, y: 2 }],
};

// I piece kicks
const I_WALL_KICKS: Record<string, Point[]> = {
  '0->1': [{ x: 0, y: 0 }, { x: -2, y: 0 }, { x: 1, y: 0 }, { x: -2, y: 1 }, { x: 1, y: -2 }],
  '1->0': [{ x: 0, y: 0 }, { x: 2, y: 0 }, { x: -1, y: 0 }, { x: 2, y: -1 }, { x: -1, y: 2 }],
  '1->2': [{ x: 0, y: 0 }, { x: -1, y: 0 }, { x: 2, y: 0 }, { x: -1, y: -2 }, { x: 2, y: 1 }],
  '2->1': [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: -2, y: 0 }, { x: 1, y: 2 }, { x: -2, y: -1 }],
  '2->3': [{ x: 0, y: 0 }, { x: 2, y: 0 }, { x: -1, y: 0 }, { x: 2, y: -1 }, { x: -1, y: 2 }],
  '3->2': [{ x: 0, y: 0 }, { x: -2, y: 0 }, { x: 1, y: 0 }, { x: -2, y: 1 }, { x: 1, y: -2 }],
  '3->0': [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: -2, y: 0 }, { x: 1, y: 2 }, { x: -2, y: -1 }],
  '0->3': [{ x: 0, y: 0 }, { x: -1, y: 0 }, { x: 2, y: 0 }, { x: -1, y: -2 }, { x: 2, y: 1 }],
};

// Check if piece collides at coordinates
export function checkCollision(
  board: BoardGrid,
  piece: { shape: number[][]; x: number; y: number }
): boolean {
  const { shape, x, y } = piece;
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c] !== 0) {
        const boardX = x + c;
        const boardY = y + r;

        // Wall collisions
        if (boardX < 0 || boardX >= BOARD_WIDTH || boardY >= BOARD_HEIGHT) {
          return true;
        }

        // Above the ceiling is allowed while piece is spawning
        if (boardY < 0) {
          continue;
        }

        // Board occupancy collision
        if (board[boardY][boardX] !== null) {
          return true;
        }
      }
    }
  }
  return false;
}

// Attempt to rotate with SRS wall kicks
export function tryRotate(
  board: BoardGrid,
  current: ActivePiece,
  direction: 'cw' | 'ccw'
): ActivePiece | null {
  if (current.type === 'O') {
    return current; // O piece doesn't change
  }

  const newShape = direction === 'cw'
    ? rotateMatrixCW(current.shape)
    : rotateMatrixCCW(current.shape);

  const prevRot = current.rotation;
  const nextRot = direction === 'cw'
    ? (prevRot + 1) % 4
    : (prevRot + 3) % 4;

  const key = `${prevRot}->${nextRot}`;
  const kickTable = current.type === 'I' ? I_WALL_KICKS : JLSTZ_WALL_KICKS;
  const tests = kickTable[key] || [{ x: 0, y: 0 }];

  for (const kick of tests) {
    const testX = current.x + kick.x;
    // In grid coords, Y goes downward so invert kick.y
    const testY = current.y - kick.y;

    if (!checkCollision(board, { shape: newShape, x: testX, y: testY })) {
      return {
        ...current,
        shape: newShape,
        x: testX,
        y: testY,
        rotation: nextRot,
      };
    }
  }

  return null;
}

// Calculate ghost piece Y position
export function getGhostPieceY(board: BoardGrid, piece: ActivePiece): number {
  let ghostY = piece.y;
  while (!checkCollision(board, { shape: piece.shape, x: piece.x, y: ghostY + 1 })) {
    ghostY++;
  }
  return ghostY;
}

// Spawn initial piece
export function spawnPiece(type: TetrominoType): ActivePiece {
  const config = TETROMINOES[type];
  const shape = config.shape.map((row) => [...row]);
  // Center horizontally
  const x = Math.floor((BOARD_WIDTH - shape[0].length) / 2);
  const y = type === 'I' ? -1 : 0;

  return {
    type,
    shape,
    x,
    y,
    rotation: 0,
  };
}

// Merge piece onto board
export function mergePieceToBoard(board: BoardGrid, piece: ActivePiece): BoardGrid {
  const newBoard = board.map((row) => [...row]);
  for (let r = 0; r < piece.shape.length; r++) {
    for (let c = 0; c < piece.shape[r].length; c++) {
      if (piece.shape[r][c] !== 0) {
        const boardY = piece.y + r;
        const boardX = piece.x + c;
        if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
          newBoard[boardY][boardX] = piece.type;
        }
      }
    }
  }
  return newBoard;
}

// Check and clear completed lines
export function clearLines(board: BoardGrid): {
  newBoard: BoardGrid;
  clearedLines: number;
  clearedIndices: number[];
} {
  const clearedIndices: number[] = [];
  const remainingRows: CellValue[][] = [];

  for (let r = 0; r < BOARD_HEIGHT; r++) {
    const isFull = board[r].every((cell) => cell !== null);
    if (isFull) {
      clearedIndices.push(r);
    } else {
      remainingRows.push([...board[r]]);
    }
  }

  const clearedLines = clearedIndices.length;
  if (clearedLines === 0) {
    return { newBoard: board, clearedLines: 0, clearedIndices: [] };
  }

  const newRows = Array.from({ length: clearedLines }, () =>
    Array.from({ length: BOARD_WIDTH }, () => null)
  );

  return {
    newBoard: [...newRows, ...remainingRows],
    clearedLines,
    clearedIndices,
  };
}

// Fall speed by level (milliseconds)
export function getDropInterval(level: number): number {
  // Speed curve formula
  const baseSpeed = 800;
  const speed = Math.max(70, baseSpeed - (level - 1) * 70);
  return speed;
}

// Calculate line score
export function calculateLineScore(lines: number, level: number): number {
  switch (lines) {
    case 1:
      return 100 * level;
    case 2:
      return 300 * level;
    case 3:
      return 500 * level;
    case 4:
      return 800 * level; // Tetris!
    default:
      return 0;
  }
}
