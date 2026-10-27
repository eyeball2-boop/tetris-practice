/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { User } from 'firebase/auth';
import { auth, subscribeToLeaderboard, saveScoreToFirestore, ScoreRecord } from './firebase';
import {
  ActivePiece,
  BoardGrid,
  BOARD_HEIGHT,
  TetrominoType,
} from './types/tetris';
import {
  BagRandomizer,
  calculateLineScore,
  checkCollision,
  clearLines,
  createEmptyBoard,
  getDropInterval,
  getGhostPieceY,
  mergePieceToBoard,
  spawnPiece,
  tryRotate,
} from './utils/tetris';
import { sound } from './utils/audio';
import { AuthBar } from './components/AuthBar';
import { GameBoard } from './components/GameBoard';
import { HoldNextPreview } from './components/HoldNextPreview';
import { Leaderboard } from './components/Leaderboard';
import { MobileControls } from './components/MobileControls';
import { DomainHelpModal } from './components/DomainHelpModal';
import { Trophy, Gamepad2, Play, RotateCcw } from 'lucide-react';

export default function App() {
  // --- Auth & User State ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [guestNickname, setGuestNickname] = useState<string>(() => {
    return localStorage.getItem('tetris_guest_name') || '게이머_' + Math.floor(1000 + Math.random() * 9000);
  });

  // --- Leaderboard State ---
  const [scores, setScores] = useState<ScoreRecord[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null);
  const [isDomainHelpOpen, setIsDomainHelpOpen] = useState(false);

  // --- Mobile Active Tab ---
  const [mobileTab, setMobileTab] = useState<'game' | 'leaderboard'>('game');

  // --- High Score from local storage fallback ---
  const [highScore, setHighScore] = useState<number>(() => {
    const saved = localStorage.getItem('tetris_personal_high_score');
    return saved ? parseInt(saved, 10) : 0;
  });

  // --- Game Engine State ---
  const [board, setBoard] = useState<BoardGrid>(createEmptyBoard);
  const [currentPiece, setCurrentPiece] = useState<ActivePiece | null>(null);
  const [holdPiece, setHoldPiece] = useState<TetrominoType | null>(null);
  const [canHold, setCanHold] = useState(true);
  const [nextPieces, setNextPieces] = useState<TetrominoType[]>([]);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [clearingRows, setClearingRows] = useState<number[]>([]);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Stats
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);

  // Bag Randomizer instance stored in ref
  const bagRef = useRef<BagRandomizer>(new BagRandomizer());
  const dropTimerRef = useRef<number | null>(null);
  const lockTimerRef = useRef<number | null>(null);

  // Show Toast
  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMsg({ text, type });
    setTimeout(() => {
      setToastMsg((prev) => (prev?.text === text ? null : prev));
    }, 4000);
  };

  // --- Firebase Listeners ---
  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });

    const unsubscribeLeaderboard = subscribeToLeaderboard(
      (data) => {
        setScores(data);
        setLeaderboardLoading(false);
        setLeaderboardError(null);
      },
      (err) => {
        setLeaderboardLoading(false);
        setLeaderboardError(err.message || '리더보드 로딩 실패');
      }
    );

    return () => {
      unsubscribeAuth();
      unsubscribeLeaderboard();
    };
  }, []);

  const handleUpdateGuestNick = (name: string) => {
    setGuestNickname(name);
    localStorage.setItem('tetris_guest_name', name);
  };

  // --- Initialize / Restart Game ---
  const startNewGame = useCallback(() => {
    const bag = new BagRandomizer();
    bagRef.current = bag;

    const firstType = bag.nextPiece();
    const upcoming = bag.peekUpcoming(4);

    setBoard(createEmptyBoard());
    setCurrentPiece(spawnPiece(firstType));
    setNextPieces(upcoming);
    setHoldPiece(null);
    setCanHold(true);
    setScore(0);
    setLines(0);
    setLevel(1);
    setCombo(0);
    setMaxCombo(0);
    setIsGameOver(false);
    setIsPaused(false);
    setClearingRows([]);
    setHasStarted(true);
  }, []);

  // Lock Piece & Trigger Line Clear
  const lockCurrentPiece = useCallback((pieceToLock: ActivePiece) => {
    sound.playHardDrop();
    const newBoard = mergePieceToBoard(board, pieceToLock);
    const { newBoard: clearedBoard, clearedLines: linesCleared, clearedIndices } = clearLines(newBoard);

    if (linesCleared > 0) {
      setClearingRows(clearedIndices);

      // Play Sound
      if (linesCleared === 4) {
        sound.playTetrisClear();
        // Exciting confetti explosion for 4-line Tetris!
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {}
      } else {
        sound.playLineClear(linesCleared);
      }

      setTimeout(() => {
        setBoard(clearedBoard);
        setClearingRows([]);

        // Score Calculation
        const linePoints = calculateLineScore(linesCleared, level);
        const comboBonus = combo > 0 ? 50 * combo * level : 0;
        const totalEarned = linePoints + comboBonus;

        const nextScore = score + totalEarned;
        const nextLines = lines + linesCleared;
        const nextLevel = Math.floor(nextLines / 10) + 1;
        const nextCombo = combo + 1;

        if (nextLevel > level) {
          sound.playLevelUp();
        }

        setScore(nextScore);
        setLines(nextLines);
        setLevel(nextLevel);
        setCombo(nextCombo);
        setMaxCombo((prev) => Math.max(prev, nextCombo));

        // Update high score
        if (nextScore > highScore) {
          setHighScore(nextScore);
          localStorage.setItem('tetris_personal_high_score', String(nextScore));
        }

        // Spawn next piece
        spawnNextPiece();
      }, 160);
    } else {
      // No lines cleared, reset combo
      setBoard(newBoard);
      setCombo(0);
      spawnNextPiece();
    }
  }, [board, score, lines, level, combo, highScore]);

  // Spawn Next Piece from Bag
  const spawnNextPiece = useCallback(() => {
    const bag = bagRef.current;
    const nextType = bag.nextPiece();
    const upcoming = bag.peekUpcoming(4);
    const newPiece = spawnPiece(nextType);

    // Check if spawn position collides -> Game Over!
    if (checkCollision(board, newPiece)) {
      handleGameOver();
      return;
    }

    setCurrentPiece(newPiece);
    setNextPieces(upcoming);
    setCanHold(true);
  }, [board]);

  // Game Over Handler & Auto Score Submission
  const handleGameOver = useCallback(async () => {
    setIsGameOver(true);
    setCurrentPiece(null);
    sound.playGameOver();

    if (score > 0) {
      showToast('게임 오버! 점수를 Firebase에 저장하는 중...', 'info');
      const res = await saveScoreToFirestore({
        score,
        lines,
        level,
        maxCombo,
        user: currentUser,
        fallbackName: guestNickname,
      });

      if (res.success) {
        showToast(`점수 (${score.toLocaleString()}점)가 랭킹 보드에 등록되었습니다!`, 'success');
        try {
          confetti({ particleCount: 50, spread: 60 });
        } catch {}
      } else {
        showToast('점수 저장 실패: ' + (res.error || '권한 오류'), 'error');
      }
    }
  }, [score, lines, level, maxCombo, currentUser, guestNickname]);

  // Move Piece Horizontally
  const moveHorizontal = useCallback((dir: number) => {
    if (!currentPiece || isGameOver || isPaused) return;
    const testPiece = {
      ...currentPiece,
      x: currentPiece.x + dir,
    };
    if (!checkCollision(board, testPiece)) {
      setCurrentPiece(testPiece);
      sound.playMove();
    }
  }, [currentPiece, board, isGameOver, isPaused]);

  // Soft Drop
  const softDrop = useCallback(() => {
    if (!currentPiece || isGameOver || isPaused) return;
    const testPiece = {
      ...currentPiece,
      y: currentPiece.y + 1,
    };
    if (!checkCollision(board, testPiece)) {
      setCurrentPiece(testPiece);
      setScore((s) => s + 1);
      sound.playDrop();
    } else {
      // Reached bottom, lock
      lockCurrentPiece(currentPiece);
    }
  }, [currentPiece, board, isGameOver, isPaused, lockCurrentPiece]);

  // Hard Drop
  const hardDrop = useCallback(() => {
    if (!currentPiece || isGameOver || isPaused) return;
    const targetY = getGhostPieceY(board, currentPiece);
    const droppedDistance = targetY - currentPiece.y;

    const droppedPiece = {
      ...currentPiece,
      y: targetY,
    };

    setScore((s) => s + droppedDistance * 2);
    lockCurrentPiece(droppedPiece);
  }, [currentPiece, board, isGameOver, isPaused, lockCurrentPiece]);

  // Rotate Piece (CW / CCW)
  const rotatePiece = useCallback((dir: 'cw' | 'ccw' = 'cw') => {
    if (!currentPiece || isGameOver || isPaused) return;
    const rotated = tryRotate(board, currentPiece, dir);
    if (rotated) {
      setCurrentPiece(rotated);
      sound.playRotate();
    }
  }, [currentPiece, board, isGameOver, isPaused]);

  // Hold Piece
  const holdCurrentPiece = useCallback(() => {
    if (!currentPiece || !canHold || isGameOver || isPaused) return;
    sound.playHold();
    const currentType = currentPiece.type;

    if (holdPiece === null) {
      // First hold: store current and spawn next
      setHoldPiece(currentType);
      const bag = bagRef.current;
      const nextType = bag.nextPiece();
      setNextPieces(bag.peekUpcoming(4));
      setCurrentPiece(spawnPiece(nextType));
    } else {
      // Swap held piece with current piece
      setHoldPiece(currentType);
      setCurrentPiece(spawnPiece(holdPiece));
    }

    setCanHold(false);
  }, [currentPiece, canHold, holdPiece, isGameOver, isPaused]);

  // Pause / Resume
  const togglePause = useCallback(() => {
    if (isGameOver || !hasStarted) return;
    setIsPaused((p) => !p);
  }, [isGameOver, hasStarted]);

  // --- Gravity Drop Timer Loop ---
  useEffect(() => {
    if (!hasStarted || isGameOver || isPaused || !currentPiece) return;

    const interval = getDropInterval(level);
    const timer = setInterval(() => {
      setCurrentPiece((prev) => {
        if (!prev) return null;
        const testPiece = { ...prev, y: prev.y + 1 };
        if (!checkCollision(board, testPiece)) {
          return testPiece;
        } else {
          // Trigger lock
          lockCurrentPiece(prev);
          return prev;
        }
      });
    }, interval);

    return () => clearInterval(timer);
  }, [hasStarted, isGameOver, isPaused, currentPiece, board, level, lockCurrentPiece]);

  // --- Keyboard Event Listener ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;

      switch (e.code) {
        case 'ArrowLeft':
          e.preventDefault();
          moveHorizontal(-1);
          break;
        case 'ArrowRight':
          e.preventDefault();
          moveHorizontal(1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          softDrop();
          break;
        case 'ArrowUp':
        case 'KeyX':
          e.preventDefault();
          rotatePiece('cw');
          break;
        case 'KeyZ':
        case 'ControlLeft':
        case 'ControlRight':
          e.preventDefault();
          rotatePiece('ccw');
          break;
        case 'Space':
          e.preventDefault();
          if (isGameOver) {
            startNewGame();
          } else {
            hardDrop();
          }
          break;
        case 'KeyC':
        case 'ShiftLeft':
        case 'ShiftRight':
          e.preventDefault();
          holdCurrentPiece();
          break;
        case 'KeyP':
        case 'Escape':
          e.preventDefault();
          togglePause();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [moveHorizontal, softDrop, rotatePiece, hardDrop, holdCurrentPiece, togglePause, isGameOver, startNewGame]);

  // Compute Ghost Piece Y
  const ghostY = currentPiece ? getGhostPieceY(board, currentPiece) : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Top Navbar */}
      <AuthBar
        user={currentUser}
        onOpenDomainHelp={() => setIsDomainHelpOpen(true)}
        guestNickname={guestNickname}
        setGuestNickname={handleUpdateGuestNick}
      />

      {/* Toast Notification */}
      {toastMsg && (
        <div
          className={`fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl shadow-xl border text-xs font-bold transition-all animate-bounce ${
            toastMsg.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-300'
              : toastMsg.type === 'error'
              ? 'bg-rose-950/90 border-rose-500/50 text-rose-300'
              : 'bg-cyan-950/90 border-cyan-500/50 text-cyan-300'
          }`}
        >
          {toastMsg.text}
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-3 md:p-6 flex flex-col">
        {/* Mobile Navigation Tab Switcher */}
        <div className="flex lg:hidden mb-3 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setMobileTab('game')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              mobileTab === 'game'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Gamepad2 className="w-4 h-4" />
            <span>테트리스 게임</span>
          </button>
          <button
            onClick={() => setMobileTab('leaderboard')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              mobileTab === 'leaderboard'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>글로벌 랭킹 ({scores.length})</span>
          </button>
        </div>

        {/* Start Game Hero Banner if game hasn't started yet */}
        {!hasStarted && (
          <div className="my-auto py-12 flex flex-col items-center justify-center text-center px-4">
            <div className="inline-block p-4 rounded-3xl bg-cyan-500/10 border-2 border-cyan-400/40 shadow-[0_0_50px_rgba(6,182,212,0.3)] mb-6 animate-pulse-glow">
              <Gamepad2 className="w-16 h-16 text-cyan-400" />
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-pink-400 to-amber-300 font-mono tracking-wider mb-3">
              ARCADE TETRIS
            </h2>
            <p className="text-sm md:text-base text-slate-300 max-w-md mb-8 leading-relaxed">
              Firebase 실시간 랭킹 시스템과 레트로 신스 사운드가 결합된 현대적 웹 테트리스
            </p>

            <button
              onClick={startNewGame}
              className="px-8 py-4 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-black text-base uppercase tracking-widest rounded-2xl shadow-xl shadow-cyan-500/40 transition-all hover:scale-105 active:scale-95 flex items-center gap-3 cursor-pointer"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>게임 시작하기</span>
            </button>

            {/* Quick keys guide */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2 text-[11px] text-slate-400 font-mono">
              <span className="bg-slate-900 border border-slate-800 px-2 py-1 rounded">← → 이동</span>
              <span className="bg-slate-900 border border-slate-800 px-2 py-1 rounded">↓ 소프트 드롭</span>
              <span className="bg-slate-900 border border-slate-800 px-2 py-1 rounded">SPACE 하드 드롭</span>
              <span className="bg-slate-900 border border-slate-800 px-2 py-1 rounded">↑ / X 회전</span>
              <span className="bg-slate-900 border border-slate-800 px-2 py-1 rounded">C 홀드</span>
            </div>
          </div>
        )}

        {/* Active Game Layout */}
        {hasStarted && (
          <div className="flex-1 flex flex-col lg:flex-row items-center lg:items-start justify-center gap-6">
            {/* Game Column (Left/Center) */}
            <div
              className={`w-full lg:w-auto flex flex-col items-center ${
                mobileTab === 'leaderboard' ? 'hidden lg:flex' : 'flex'
              }`}
            >
              <div className="flex items-start justify-center gap-4">
                {/* Hold & Stats Left Panel (Desktop) */}
                <div className="hidden sm:block">
                  <HoldNextPreview
                    holdPiece={holdPiece}
                    canHold={canHold}
                    nextPieces={nextPieces}
                    stats={{
                      score,
                      lines,
                      level,
                      combo,
                      highScore,
                    }}
                  />
                </div>

                {/* Tetris Board */}
                <div className="flex flex-col items-center">
                  <GameBoard
                    board={board}
                    currentPiece={currentPiece}
                    ghostY={ghostY}
                    clearingRows={clearingRows}
                    isGameOver={isGameOver}
                    isPaused={isPaused}
                    onRestart={startNewGame}
                    onResume={() => setIsPaused(false)}
                  />

                  {/* Quick controls bar below board */}
                  <div className="mt-3 flex items-center gap-3">
                    <button
                      onClick={startNewGame}
                      className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
                      <span>새 게임</span>
                    </button>
                    <button
                      onClick={togglePause}
                      className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      {isPaused ? '계속하기' : '일시정지 (P)'}
                    </button>
                  </div>
                </div>

                {/* Mobile stats summary (shown when screen < sm) */}
                <div className="sm:hidden flex flex-col gap-2">
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-center min-w-[70px]">
                    <span className="text-[9px] text-slate-400 font-mono block">SCORE</span>
                    <span className="text-xs font-bold text-cyan-400 font-mono">
                      {score.toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-center min-w-[70px]">
                    <span className="text-[9px] text-slate-400 font-mono block">NEXT</span>
                    <span className="text-xs font-bold text-purple-400 font-mono">
                      {nextPieces[0] || '-'}
                    </span>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-center min-w-[70px]">
                    <span className="text-[9px] text-slate-400 font-mono block">HOLD</span>
                    <span className="text-xs font-bold text-amber-400 font-mono">
                      {holdPiece || '-'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Mobile Arcade Controller Pad */}
              <div className="w-full mt-3 block lg:hidden">
                <MobileControls
                  onMoveLeft={() => moveHorizontal(-1)}
                  onMoveRight={() => moveHorizontal(1)}
                  onSoftDrop={softDrop}
                  onHardDrop={hardDrop}
                  onRotateCW={() => rotatePiece('cw')}
                  onRotateCCW={() => rotatePiece('ccw')}
                  onHold={holdCurrentPiece}
                  onTogglePause={togglePause}
                  isPaused={isPaused}
                />
              </div>
            </div>

            {/* Leaderboard Column (Right) */}
            <div
              className={`w-full lg:w-80 xl:w-96 ${
                mobileTab === 'game' ? 'hidden lg:block' : 'block'
              }`}
            >
              <Leaderboard
                scores={scores}
                currentUser={currentUser}
                isLoading={leaderboardLoading}
                error={leaderboardError}
                onRefresh={() => {
                  setLeaderboardLoading(true);
                  subscribeToLeaderboard(
                    (data) => {
                      setScores(data);
                      setLeaderboardLoading(false);
                      setLeaderboardError(null);
                    },
                    (err) => {
                      setLeaderboardLoading(false);
                      setLeaderboardError(err.message || '리더보드 로딩 실패');
                    }
                  );
                }}
                onOpenDomainHelp={() => setIsDomainHelpOpen(true)}
              />
            </div>
          </div>
        )}
      </main>

      {/* Domain & GitHub Help Modal */}
      <DomainHelpModal
        isOpen={isDomainHelpOpen}
        onClose={() => setIsDomainHelpOpen(false)}
      />
    </div>
  );
}
