import React from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowDown,
  RotateCw,
  RotateCcw,
  Zap,
  Repeat,
  Pause,
  Play,
} from 'lucide-react';

interface MobileControlsProps {
  onMoveLeft: () => void;
  onMoveRight: () => void;
  onSoftDrop: () => void;
  onHardDrop: () => void;
  onRotateCW: () => void;
  onRotateCCW: () => void;
  onHold: () => void;
  onTogglePause: () => void;
  isPaused: boolean;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  onMoveLeft,
  onMoveRight,
  onSoftDrop,
  onHardDrop,
  onRotateCW,
  onRotateCCW,
  onHold,
  onTogglePause,
  isPaused,
}) => {
  const triggerHaptic = (duration = 20) => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(duration);
      } catch (e) {}
    }
  };

  const handleAction = (fn: () => void, hapticMs = 20) => {
    triggerHaptic(hapticMs);
    fn();
  };

  return (
    <div className="w-full max-w-md mx-auto pt-2 pb-4 select-none touch-manipulation">
      <div className="grid grid-cols-5 gap-2 px-2">
        {/* Hold */}
        <button
          onClick={() => handleAction(onHold, 30)}
          className="h-12 rounded-xl bg-slate-800/90 active:bg-cyan-500 active:text-slate-950 border border-slate-700 active:border-cyan-400 flex flex-col items-center justify-center text-slate-300 font-bold transition-all shadow-md active:scale-95"
        >
          <Repeat className="w-4 h-4 text-cyan-400" />
          <span className="text-[9px] uppercase font-mono mt-0.5">HOLD</span>
        </button>

        {/* Rotate CCW */}
        <button
          onClick={() => handleAction(onRotateCCW, 25)}
          className="h-12 rounded-xl bg-slate-800/90 active:bg-purple-500 active:text-white border border-slate-700 active:border-purple-400 flex flex-col items-center justify-center text-slate-300 font-bold transition-all shadow-md active:scale-95"
        >
          <RotateCcw className="w-4 h-4 text-purple-400" />
          <span className="text-[9px] font-mono mt-0.5">CCW</span>
        </button>

        {/* Hard Drop */}
        <button
          onClick={() => handleAction(onHardDrop, 50)}
          className="h-12 rounded-xl bg-gradient-to-b from-rose-500/20 to-rose-600/30 active:from-rose-500 active:to-rose-600 border border-rose-500/50 flex flex-col items-center justify-center text-rose-300 active:text-white font-bold transition-all shadow-lg active:scale-95 shadow-rose-500/10"
        >
          <Zap className="w-4 h-4 text-rose-400" />
          <span className="text-[9px] font-mono mt-0.5">DROP</span>
        </button>

        {/* Rotate CW */}
        <button
          onClick={() => handleAction(onRotateCW, 25)}
          className="h-12 rounded-xl bg-slate-800/90 active:bg-cyan-500 active:text-slate-950 border border-slate-700 active:border-cyan-400 flex flex-col items-center justify-center text-slate-300 font-bold transition-all shadow-md active:scale-95"
        >
          <RotateCw className="w-4 h-4 text-cyan-400" />
          <span className="text-[9px] font-mono mt-0.5">ROTATE</span>
        </button>

        {/* Pause */}
        <button
          onClick={() => handleAction(onTogglePause, 20)}
          className="h-12 rounded-xl bg-slate-800/90 active:bg-amber-500 active:text-slate-950 border border-slate-700 active:border-amber-400 flex flex-col items-center justify-center text-slate-300 font-bold transition-all shadow-md active:scale-95"
        >
          {isPaused ? <Play className="w-4 h-4 text-emerald-400" /> : <Pause className="w-4 h-4 text-amber-400" />}
          <span className="text-[9px] font-mono mt-0.5">{isPaused ? 'RESUME' : 'PAUSE'}</span>
        </button>
      </div>

      {/* Directional Pad */}
      <div className="grid grid-cols-3 gap-2 px-4 mt-2">
        <button
          onClick={() => handleAction(onMoveLeft, 15)}
          className="h-14 rounded-xl bg-slate-800/90 active:bg-slate-700 border border-slate-700 active:border-cyan-400 flex items-center justify-center text-cyan-400 shadow-md active:scale-95 text-lg"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <button
          onClick={() => handleAction(onSoftDrop, 15)}
          className="h-14 rounded-xl bg-slate-800/90 active:bg-slate-700 border border-slate-700 active:border-cyan-400 flex items-center justify-center text-cyan-400 shadow-md active:scale-95 text-lg"
        >
          <ArrowDown className="w-6 h-6" />
        </button>

        <button
          onClick={() => handleAction(onMoveRight, 15)}
          className="h-14 rounded-xl bg-slate-800/90 active:bg-slate-700 border border-slate-700 active:border-cyan-400 flex items-center justify-center text-cyan-400 shadow-md active:scale-95 text-lg"
        >
          <ArrowRight className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};
