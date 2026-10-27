import React, { useState } from 'react';
import { X, Copy, Check, ExternalLink, ShieldCheck, Globe, Database, Github } from 'lucide-react';

interface DomainHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DomainHelpModal: React.FC<DomainHelpModalProps> = ({ isOpen, onClose }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentDevDomain = 'ais-dev-v7hypzwa7zckndvof7yi5z-352925451952.asia-northeast1.run.app';
  const currentPreDomain = 'ais-pre-v7hypzwa7zckndvof7yi5z-352925451952.asia-northeast1.run.app';
  const githubPagesExample = '<본인의 깃허브 아이디>.github.io';

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const firestoreRulesCode = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 테트리스 랭킹 점수 컬렉션
    match /tetris_scores/{document} {
      allow read: if true; // 누구나 실시간 랭킹 조회 가능
      allow write: if true; // 점수 저장 허용 (또는 if request.auth != null;)
    }
  }
}`;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl max-w-2xl w-full p-5 md:p-6 shadow-[0_0_40px_rgba(6,182,212,0.3)] relative my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-black text-white font-mono">
              Firebase & GitHub 연동 도메인 가이드
            </h2>
            <p className="text-xs text-slate-400">
              Google 로그인 및 GitHub Pages 배포 시 추가해야 할 필수 도메인 목록입니다.
            </p>
          </div>
        </div>

        <div className="space-y-5 text-sm">
          {/* STEP 1: Firebase Auth Authorized Domains */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
            <div className="flex items-center gap-2 mb-2 font-bold text-cyan-300">
              <ShieldCheck className="w-4 h-4" />
              <span>1. Firebase 콘솔 승인된 도메인 (Authorized Domains) 추가</span>
            </div>
            <p className="text-xs text-slate-400 mb-3 leading-relaxed">
              Firebase 콘솔 &gt; <b>Authentication</b> &gt; <b>설정(Settings)</b> &gt; <b>승인된 도메인(Authorized domains)</b> 탭에서 아래 도메인들을 추가해주세요.
            </p>

            <div className="space-y-2">
              {/* Dev Domain */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
                <div>
                  <span className="text-[10px] text-cyan-400 font-mono block">현재 AI Studio 개발 도메인</span>
                  <code className="text-xs text-slate-200 select-all">{currentDevDomain}</code>
                </div>
                <button
                  onClick={() => copyToClipboard(currentDevDomain, 'dev')}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey === 'dev' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>복사</span>
                </button>
              </div>

              {/* Shared Domain */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
                <div>
                  <span className="text-[10px] text-purple-400 font-mono block">AI Studio 공유 프리뷰 도메인</span>
                  <code className="text-xs text-slate-200 select-all">{currentPreDomain}</code>
                </div>
                <button
                  onClick={() => copyToClipboard(currentPreDomain, 'pre')}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey === 'pre' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>복사</span>
                </button>
              </div>

              {/* GitHub Pages Domain */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
                <div>
                  <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                    <Github className="w-3 h-3" /> GitHub Pages 배포 시 필수 도메인
                  </span>
                  <code className="text-xs text-slate-200 select-all">{githubPagesExample}</code>
                </div>
                <button
                  onClick={() => copyToClipboard(githubPagesExample, 'gh')}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey === 'gh' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>복사</span>
                </button>
              </div>

              {/* Localhost */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 font-mono block">로컬 개발 도메인</span>
                  <code className="text-xs text-slate-300">localhost</code>
                </div>
                <span className="text-[11px] text-slate-500">기본 추가됨</span>
              </div>
            </div>
          </div>

          {/* STEP 2: Firestore Database Rules */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 font-bold text-amber-400">
                <Database className="w-4 h-4" />
                <span>2. Cloud Firestore 보안 규칙 (Rules)</span>
              </div>
              <button
                onClick={() => copyToClipboard(firestoreRulesCode, 'rules')}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 flex items-center gap-1 cursor-pointer"
              >
                {copiedKey === 'rules' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>규칙 복사</span>
              </button>
            </div>
            <p className="text-xs text-slate-400 mb-2">
              Firebase 콘솔 &gt; <b>Firestore Database</b> &gt; <b>규칙(Rules)</b> 탭에 붙여넣고 [게시(Publish)] 해주시면 누구나 랭킹을 읽고 점수를 저장할 수 있습니다.
            </p>
            <pre className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-cyan-300 overflow-x-auto leading-relaxed">
              {firestoreRulesCode}
            </pre>
          </div>

          {/* STEP 3: Firebase Auth Sign-in Methods */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
            <div className="font-bold text-slate-200 mb-1">
              3. 로그인 제공업체(Sign-in provider) 활성화 확인
            </div>
            <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
              <li>Firebase 콘솔 &gt; Authentication &gt; <b>Sign-in method</b></li>
              <li><b className="text-white">Google</b> 로그인 활성화 (프로젝트 지원 이메일 선택)</li>
              <li><b className="text-white">익명(Anonymous)</b> 로그인 활성화 (게스트 플레이 시 사용)</li>
            </ul>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 cursor-pointer"
          >
            확인 및 닫기
          </button>
        </div>
      </div>
    </div>
  );
};
