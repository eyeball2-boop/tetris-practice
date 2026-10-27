import React, { useState } from 'react';
import { ScoreRecord } from '../firebase';
import { Trophy, Medal, Flame, Clock, RefreshCw, UserCheck, AlertCircle } from 'lucide-react';
import { User } from 'firebase/auth';

interface LeaderboardProps {
  scores: ScoreRecord[];
  currentUser: User | null;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
  onOpenDomainHelp: () => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
  scores,
  currentUser,
  isLoading,
  error,
  onRefresh,
  onOpenDomainHelp,
}) => {
  const [filter, setFilter] = useState<'all' | 'mine'>('all');

  const filteredScores = filter === 'mine' && currentUser
    ? scores.filter((s) => s.uid === currentUser.uid)
    : scores;

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '방금 전';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('ko-KR', {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '';
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md flex flex-col h-full max-h-[640px] w-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-white font-mono tracking-wide flex items-center gap-2">
              HALL OF FAME
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-sans font-medium">
                LIVE
              </span>
            </h2>
            <p className="text-xs text-slate-400">실시간 글로벌 테트리스 랭킹</p>
          </div>
        </div>

        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          title="새로고침"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 my-3">
        <button
          onClick={() => setFilter('all')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            filter === 'all'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
              : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
          }`}
        >
          전체 랭킹 ({scores.length})
        </button>
        <button
          onClick={() => setFilter('mine')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            filter === 'mine'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
              : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
          }`}
        >
          내 점수
        </button>
      </div>

      {/* Permission / Domain Error Alert */}
      {error && (
        <div className="p-3 mb-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs flex flex-col gap-2">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-300">Firebase 연결 안내</p>
              <p className="text-[11px] text-amber-200/80 mt-0.5">
                Firestore 보안 규칙 또는 인증 도메인 설정이 필요할 수 있습니다.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenDomainHelp}
            className="self-end text-[11px] text-cyan-300 hover:underline font-medium cursor-pointer"
          >
            설정 가이드 & 도메인 보기 →
          </button>
        </div>
      )}

      {/* Score List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
        {filteredScores.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-center p-4 text-slate-500">
            <Medal className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-xs font-medium">아직 등록된 랭킹 기록이 없습니다.</p>
            <p className="text-[11px] text-slate-600 mt-1">게임을 플레이하고 첫 기록의 주인공이 되어보세요!</p>
          </div>
        ) : (
          filteredScores.map((record, index) => {
            const isTop3 = index < 3 && filter === 'all';
            const isMe = currentUser && record.uid === currentUser.uid;

            let rankBadge = (
              <span className="w-6 text-center font-mono font-bold text-xs text-slate-400">
                #{index + 1}
              </span>
            );

            if (isTop3) {
              const colors = [
                'bg-amber-400 text-slate-950 shadow-[0_0_10px_#f59e0b]',
                'bg-slate-200 text-slate-950 shadow-[0_0_8px_#cbd5e1]',
                'bg-amber-700 text-white shadow-[0_0_8px_#b45309]',
              ];
              rankBadge = (
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${colors[index]}`}
                >
                  {index + 1}
                </div>
              );
            }

            return (
              <div
                key={record.id || index}
                className={`p-2.5 rounded-xl border transition-all flex items-center gap-3 ${
                  isMe
                    ? 'bg-cyan-950/40 border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                    : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                {rankBadge}

                {/* Avatar */}
                {record.photoURL ? (
                  <img
                    src={record.photoURL}
                    alt={record.displayName}
                    className="w-7 h-7 rounded-full object-cover border border-slate-700 shrink-0"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-cyan-400 shrink-0">
                    {record.displayName?.charAt(0) || 'G'}
                  </div>
                )}

                {/* Name & Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-200 truncate">
                      {record.displayName}
                    </span>
                    {isMe && (
                      <span className="text-[9px] bg-cyan-500/20 text-cyan-300 px-1 py-0.2 rounded font-mono font-bold">
                        YOU
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                    <span>Lv.{record.level}</span>
                    <span>•</span>
                    <span>{record.lines}줄</span>
                    {record.maxCombo > 1 && (
                      <>
                        <span>•</span>
                        <span className="text-amber-400 flex items-center gap-0.5">
                          <Flame className="w-2.5 h-2.5" />
                          {record.maxCombo}x
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Score & Date */}
                <div className="text-right shrink-0">
                  <span className="text-sm font-black text-cyan-400 font-mono block">
                    {record.score.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {formatDate(record.createdAt)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer link to domain help */}
      <div className="pt-3 border-t border-slate-800 text-center">
        <button
          onClick={onOpenDomainHelp}
          className="text-xs text-slate-400 hover:text-cyan-400 transition-colors underline cursor-pointer"
        >
          Firebase 도메인 & GitHub 배포 설정 안내
        </button>
      </div>
    </div>
  );
};
