export type TetrominoType = 'I' | 'J' | 'L' | 'O' | 'S' | 'T' | 'Z';

export type CellValue = TetrominoType | null;

export type BoardGrid = CellValue[][];

export interface Point {
  x: number;
  y: number;
}

export interface Tetromino {
  type: TetrominoType;
  shape: number[][]; // 0 and 1
  color: string;
  glowColor: string;
}

export interface ActivePiece {
  type: TetrominoType;
  shape: number[][];
  x: number;
  y: number;
  rotation: number; // 0, 1, 2, 3
}

export interface GameStats {
  score: number;
  lines: number;
  level: number;
  combo: number;
  maxCombo: number;
  singles: number;
  doubles: number;
  triples: number;
  tetrises: number;
}

export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;

export const TETROMINOES: Record<
  TetrominoType,
  {
    shape: number[][];
    color: string;
    glowColor: string;
    border: string;
  }
> = {
  I: {
    shape: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    color: 'bg-cyan-500',
    glowColor: '#06b6d4',
    border: 'border-cyan-300',
  },
  J: {
    shape: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: 'bg-blue-500',
    glowColor: '#3b82f6',
    border: 'border-blue-300',
  },
  L: {
    shape: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: 'bg-amber-500',
    glowColor: '#f59e0b',
    border: 'border-amber-300',
  },
  O: {
    shape: [
      [1, 1],
      [1, 1],
    ],
    color: 'bg-yellow-400',
    glowColor: '#eab308',
    border: 'border-yellow-200',
  },
  S: {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0],
    ],
    color: 'bg-emerald-500',
    glowColor: '#10b981',
    border: 'border-emerald-300',
  },
  T: {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: 'bg-purple-500',
    glowColor: '#a855f7',
    border: 'border-purple-300',
  },
  Z: {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0],
    ],
    color: 'bg-rose-500',
    glowColor: '#f43f5e',
    border: 'border-rose-300',
  },
};
