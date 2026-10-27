import React, { useEffect, useRef } from 'react';
import {
  ActivePiece,
  BoardGrid,
  BOARD_HEIGHT,
  BOARD_WIDTH,
  TETROMINOES,
} from '../types/tetris';

interface GameBoardProps {
  board: BoardGrid;
  currentPiece: ActivePiece | null;
  ghostY: number;
  clearingRows: number[];
  isGameOver: boolean;
  isPaused: boolean;
  onRestart: () => void;
  onResume: () => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  board,
  currentPiece,
  ghostY,
  clearingRows,
  isGameOver,
  isPaused,
  onRestart,
  onResume,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Render combined grid
  const displayGrid = board.map((row) => [...row]);

  // Overlay ghost piece
  const ghostCells = new Set<string>();
  if (currentPiece && ghostY !== currentPiece.y) {
    for (let r = 0; r < currentPiece.shape.length; r++) {
      for (let c = 0; c < currentPiece.shape[r].length; c++) {
        if (currentPiece.shape[r][c] !== 0) {
          const by = ghostY + r;
          const bx = currentPiece.x + c;
          if (by >= 0 && by < BOARD_HEIGHT && bx >= 0 && bx < BOARD_WIDTH) {
            ghostCells.add(`${by},${bx}`);
          }
        }
      }
    }
  }

  // Overlay current active piece
  const activeCells = new Map<string, { type: string; color: string; glow: string }>();
  if (currentPiece) {
    const meta = TETROMINOES[currentPiece.type];
    for (let r = 0; r < currentPiece.shape.length; r++) {
      for (let c = 0; c < currentPiece.shape[r].length; c++) {
        if (currentPiece.shape[r][c] !== 0) {
          const by = currentPiece.y + r;
          const bx = currentPiece.x + c;
          if (by >= 0 && by < BOARD_HEIGHT && bx >= 0 && bx < BOARD_WIDTH) {
            activeCells.set(`${by},${bx}`, {
              type: currentPiece.type,
              color: meta.color,
              glow: meta.glowColor,
            });
          }
        }
      }
    }
  }

  return (
    <div className="relative p-2 md:p-3 bg-slate-900/90 rounded-2xl border-2 border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.2)] backdrop-blur-md">
      {/* Outer arcade neon border glow */}
      <div className="absolute inset-0 rounded-2xl pointer-events-none border border-cyan-400/20 shadow-[inset_0_0_20px_rgba(6,182,212,0.15)]" />

      {/* Grid Canvas Frame */}
      <div
        className="grid grid-cols-10 gap-[2px] bg-slate-950 p-2 rounded-xl relative overflow-hidden select-none"
        style={{
          width: 'min(76vw, 320px)',
          height: 'min(152vw, 640px)',
        }}
      >
        {/* Subtle grid background pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-30 pointer-events-none" />

        {/* 200 Board cells */}
        {Array.from({ length: BOARD_HEIGHT }).map((_, r) => {
          const isClearing = clearingRows.includes(r);
          return Array.from({ length: BOARD_WIDTH }).map((_, c) => {
            const key = `${r},${c}`;
            const boardVal = displayGrid[r][c];
            const active = activeCells.get(key);
            const isGhost = ghostCells.has(key);

            let cellBg = 'bg-slate-900/60 border-slate-800/40';
            let cellStyle: React.CSSProperties = {};

            if (isClearing) {
              cellBg = 'bg-white shadow-[0_0_15px_#ffffff] animate-pulse';
            } else if (active) {
              const meta = TETROMINOES[active.type as keyof typeof TETROMINOES];
              cellBg = `${meta.color} border-t-white/40 border-l-white/30 border-b-black/50 border-r-black/40`;
              cellStyle = {
                boxShadow: `0 0 10px ${meta.glowColor}, inset 0 0 4px rgba(255,255,255,0.4)`,
              };
            } else if (boardVal) {
              const meta = TETROMINOES[boardVal];
              cellBg = `${meta.color} border-t-white/30 border-l-white/20 border-b-black/60 border-r-black/50`;
              cellStyle = {
                boxShadow: `inset 0 0 4px rgba(255,255,255,0.25)`,
              };
            } else if (isGhost && currentPiece) {
              const meta = TETROMINOES[currentPiece.type];
              cellBg = 'bg-transparent border-dashed border-2';
              cellStyle = {
                borderColor: `${meta.glowColor}90`,
                boxShadow: `inset 0 0 6px ${meta.glowColor}40`,
              };
            }

            return (
              <div
                key={key}
                style={cellStyle}
                className={`relative rounded-[3px] border transition-all duration-75 flex items-center justify-center ${cellBg}`}
              >
                {/* 3D block inner bevel highlight */}
                {(active || boardVal) && !isClearing && (
                  <div className="absolute inset-[2px] rounded-[1px] bg-white/10 pointer-events-none" />
                )}
              </div>
            );
          });
        })}

        {/* Scanlines visual overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] pointer-events-none opacity-40" />

        {/* Pause Overlay */}
        {isPaused && !isGameOver && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center z-20 animate-fade-in">
            <div className="px-6 py-4 rounded-xl border border-cyan-500/40 bg-slate-900/90 shadow-[0_0_20px_rgba(6,182,212,0.4)] text-center">
              <span className="text-2xl font-black tracking-widest text-cyan-400 font-mono block mb-2">
                PAUSED
              </span>
              <p className="text-xs text-slate-400 mb-4 font-mono">게임이 일시정지 되었습니다</p>
              <button
                onClick={onResume}
                className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm rounded-lg shadow-lg shadow-cyan-500/30 transition-transform active:scale-95 cursor-pointer"
              >
                계속하기 (P)
              </button>
            </div>
          </div>
        )}

        {/* Game Over Overlay */}
        {isGameOver && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center z-30 animate-fade-in p-4 text-center">
            <div className="p-5 rounded-2xl border-2 border-rose-500/60 bg-slate-900/95 shadow-[0_0_35px_rgba(244,63,94,0.4)] max-w-xs w-full">
              <span className="text-2xl font-black tracking-widest text-rose-500 font-mono block animate-pulse mb-1">
                GAME OVER
              </span>
              <p className="text-xs text-slate-400 mb-4">블록이 꼭대기에 도달했습니다!</p>

              <button
                onClick={onRestart}
                className="w-full py-3 bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 hover:from-rose-400 hover:to-purple-500 text-white font-black text-sm uppercase tracking-wider rounded-xl shadow-lg shadow-rose-500/40 transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                다시 시작 (Space)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
