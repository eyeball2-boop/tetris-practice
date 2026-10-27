import React, { useState } from 'react';
import { User } from 'firebase/auth';
import {
  loginWithGoogle,
  loginAsGuest,
  logoutUser,
  updateUserDisplayName,
} from '../firebase';
import {
  LogIn,
  LogOut,
  Volume2,
  VolumeX,
  Music,
  User as UserIcon,
  HelpCircle,
  Gamepad2,
  Edit2,
  Check,
} from 'lucide-react';
import { sound } from '../utils/audio';

interface AuthBarProps {
  user: User | null;
  onOpenDomainHelp: () => void;
  guestNickname: string;
  setGuestNickname: (name: string) => void;
}

export const AuthBar: React.FC<AuthBarProps> = ({
  user,
  onOpenDomainHelp,
  guestNickname,
  setGuestNickname,
}) => {
  const [sfxMuted, setSfxMuted] = useState(sound.getSfxMuted());
  const [bgmMuted, setBgmMuted] = useState(sound.getMusicMuted());
  const [isEditingNick, setIsEditingNick] = useState(false);
  const [tempNick, setTempNick] = useState(user?.displayName || guestNickname || '');
  const [loginLoading, setLoginLoading] = useState(false);
  const [showNickModal, setShowNickModal] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const toggleSfx = () => {
    const next = !sfxMuted;
    sound.setSfxMuted(next);
    setSfxMuted(next);
  };

  const toggleBgm = () => {
    const next = !bgmMuted;
    sound.setMusicMuted(next);
    setBgmMuted(next);
  };

  const handleGoogleLogin = async () => {
    setLoginLoading(true);
    setAuthError(null);
    try {
      await loginWithGoogle();
    } catch (e: any) {
      console.error(e);
      if (e?.code === 'auth/unauthorized-domain') {
        setAuthError(
          'Firebase 승인된 도메인 등록이 필요합니다. 상단의 안내(도메인 설정) 버튼을 확인하세요.'
        );
      } else {
        setAuthError(e?.message || '로그인 중 오류가 발생했습니다.');
      }
    } finally {
      setLoginLoading(false);
    }
  };

  const handleGuestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempNick.trim()) return;
    setLoginLoading(true);
    try {
      await loginAsGuest(tempNick.trim());
      setGuestNickname(tempNick.trim());
      setShowNickModal(false);
    } catch (e: any) {
      setAuthError(e?.message || '게스트 로그인 실패');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSaveNickname = async () => {
    if (!tempNick.trim()) return;
    if (user) {
      await updateUserDisplayName(tempNick.trim());
    }
    setGuestNickname(tempNick.trim());
    setIsEditingNick(false);
  };

  return (
    <header className="w-full bg-slate-900/90 border-b border-slate-800/80 backdrop-blur-md px-4 py-3 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-fuchsia-500 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.5)]">
            <Gamepad2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-pink-400 to-amber-300 font-mono tracking-wider">
              NEON TETRIS
            </h1>
            <span className="text-[10px] text-slate-400 tracking-widest font-mono uppercase block -mt-0.5">
              Arcade & Firestore Leaderboard
            </span>
          </div>
        </div>

        {/* Audio controls & Action buttons */}
        <div className="flex items-center gap-2">
          {/* Sound Effect Toggle */}
          <button
            onClick={toggleSfx}
            className={`p-2 rounded-lg border transition-all cursor-pointer ${
              sfxMuted
                ? 'bg-slate-800/60 border-slate-700 text-slate-500'
                : 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.2)]'
            }`}
            title={sfxMuted ? '효과음 켜기' : '효과음 끄기'}
          >
            {sfxMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* BGM Chiptune Toggle */}
          <button
            onClick={toggleBgm}
            className={`p-2 rounded-lg border transition-all cursor-pointer ${
              bgmMuted
                ? 'bg-slate-800/60 border-slate-700 text-slate-500'
                : 'bg-purple-500/10 border-purple-500/40 text-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.2)]'
            }`}
            title={bgmMuted ? '8비트 BGM 켜기' : 'BGM 끄기'}
          >
            <Music className="w-4 h-4" />
          </button>

          {/* Domain & Deployment help modal trigger */}
          <button
            onClick={onOpenDomainHelp}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">도메인 & GitHub 연동</span>
            <span className="sm:hidden">도메인</span>
          </button>

          {/* User Profile / Auth State */}
          {user ? (
            <div className="flex items-center gap-2 pl-1 border-l border-slate-800">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-8 h-8 rounded-full border border-cyan-400/50"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-xs font-bold text-cyan-400">
                  {user.displayName?.charAt(0) || 'G'}
                </div>
              )}

              {isEditingNick ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={tempNick}
                    onChange={(e) => setTempNick(e.target.value)}
                    maxLength={12}
                    className="w-24 px-2 py-1 text-xs bg-slate-800 border border-cyan-400 rounded text-white focus:outline-none"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveNickname}
                    className="p-1 rounded bg-cyan-500 text-slate-950 hover:bg-cyan-400"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1 group">
                  <span className="text-xs font-bold text-slate-200 max-w-[100px] truncate">
                    {user.displayName || guestNickname || '플레이어'}
                  </span>
                  <button
                    onClick={() => {
                      setTempNick(user.displayName || guestNickname || '');
                      setIsEditingNick(true);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-white transition-opacity"
                    title="닉네임 변경"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                </div>
              )}

              <button
                onClick={() => logoutUser()}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                title="로그아웃"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleGoogleLogin}
                disabled={loginLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold shadow-md shadow-white/10 transition-all active:scale-95 cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Google 로그인</span>
              </button>

              <button
                onClick={() => setShowNickModal(true)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
              >
                게스트 플레이
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Auth error notification banner */}
      {authError && (
        <div className="max-w-6xl mx-auto mt-2 p-2 rounded-lg bg-rose-950/70 border border-rose-500/40 text-rose-200 text-xs flex items-center justify-between">
          <span>{authError}</span>
          <button
            onClick={() => setAuthError(null)}
            className="text-slate-400 hover:text-white px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Guest Nickname Modal */}
      {showNickModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl p-6 max-w-sm w-full shadow-[0_0_30px_rgba(6,182,212,0.3)]">
            <h3 className="text-base font-bold text-white mb-2 font-mono">
              게스트 닉네임 입력
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              랭킹 보드에 기록될 이름을 입력하세요.
            </p>
            <form onSubmit={handleGuestSubmit}>
              <input
                type="text"
                placeholder="예: 테트리스고수"
                value={tempNick}
                onChange={(e) => setTempNick(e.target.value)}
                maxLength={12}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white mb-4 text-sm focus:border-cyan-400 focus:outline-none"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowNickModal(false)}
                  className="flex-1 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={loginLoading}
                  className="flex-1 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-bold hover:from-cyan-400 hover:to-blue-500 shadow-md shadow-cyan-500/30"
                >
                  {loginLoading ? '접속 중...' : '확인'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
