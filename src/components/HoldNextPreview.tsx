import React from 'react';
import { TETROMINOES, TetrominoType } from '../types/tetris';

interface HoldNextPreviewProps {
  holdPiece: TetrominoType | null;
  canHold: boolean;
  nextPieces: TetrominoType[];
  stats: {
    score: number;
    lines: number;
    level: number;
    combo: number;
    highScore: number;
  };
}

// Mini preview grid for a single tetromino
const MiniPieceGrid: React.FC<{ type: TetrominoType | null; size?: 'sm' | 'md' }> = ({
  type,
  size = 'md',
}) => {
  if (!type) {
    return (
      <div className="w-16 h-12 flex items-center justify-center text-slate-600 text-xs font-mono">
        EMPTY
      </div>
    );
  }

  const meta = TETROMINOES[type];
  const shape = meta.shape;
  const cellSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';

  return (
    <div className="inline-grid gap-[2px] p-1.5 rounded-lg bg-slate-950/70 border border-slate-800/80">
      {shape.map((row, r) => (
        <div key={r} className="flex gap-[2px]">
          {row.map((val, c) => (
            <div
              key={c}
              className={`${cellSize} rounded-[2px] transition-all ${
                val
                  ? `${meta.color} border border-white/30 shadow-[0_0_6px_${meta.glowColor}]`
                  : 'bg-transparent border-transparent'
              }`}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export const HoldNextPreview: React.FC<HoldNextPreviewProps> = ({
  holdPiece,
  canHold,
  nextPieces,
  stats,
}) => {
  return (
    <div className="flex flex-col gap-3 w-full max-w-[210px]">
      {/* HOLD PIECE BOX */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-lg shadow-black/40 backdrop-blur-md">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
            HOLD (C)
          </span>
          {!canHold && (
            <span className="text-[10px] text-amber-400 font-mono bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
              LOCKED
            </span>
          )}
        </div>
        <div className="flex items-center justify-center min-h-[64px]">
          <MiniPieceGrid type={holdPiece} />
        </div>
      </div>

      {/* STATS PANEL */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-lg shadow-black/40 backdrop-blur-md space-y-2.5">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block font-mono">
            SCORE
          </span>
          <span className="text-xl font-black text-cyan-400 font-mono tracking-tight">
            {stats.score.toLocaleString()}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block font-mono">
              LEVEL
            </span>
            <span className="text-base font-bold text-purple-400 font-mono">
              {stats.level}
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block font-mono">
              LINES
            </span>
            <span className="text-base font-bold text-emerald-400 font-mono">
              {stats.lines}
            </span>
          </div>
        </div>

        {stats.combo > 1 && (
          <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-amber-400 animate-pulse">
            <span className="text-xs font-black tracking-wider">COMBO</span>
            <span className="text-sm font-black">x{stats.combo}</span>
          </div>
        )}

        <div className="pt-1.5 border-t border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block font-mono">
            HIGH SCORE
          </span>
          <span className="text-sm font-bold text-amber-300 font-mono">
            {stats.highScore.toLocaleString()}
          </span>
        </div>
      </div>

      {/* NEXT QUEUE BOX */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-lg shadow-black/40 backdrop-blur-md">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono block mb-2">
          NEXT
        </span>
        <div className="flex flex-col items-center gap-2">
          {nextPieces.slice(0, 3).map((type, idx) => (
            <div key={idx} className="flex items-center justify-center">
              <MiniPieceGrid type={type} size={idx === 0 ? 'md' : 'sm'} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
