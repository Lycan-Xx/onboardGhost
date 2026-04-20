'use client';

import { useEffect, useState, Suspense, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { repoIdToDisplayName, repoIdToOwnerAvatar, repoIdToOwnerRepo } from '@/lib/utils/repo';
import { Check, Loader2, AlertCircle, ArrowLeft, Sparkles } from 'lucide-react';

const GhIcon = ({ size = 16, className = '' }: { size?: number; className?: string }) => (
  <svg viewBox="0 0 16 16" width={size} height={size} fill="currentColor" className={className} aria-hidden>
    <path fillRule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
  </svg>
);
import Link from 'next/link';

interface AnalysisProgress {
  current_step: number;
  step_name: string;
  step_status: 'pending' | 'in-progress' | 'completed' | 'failed';
  logs: any[];
  updated_at: any;
}

interface Stage {
  key: string;
  label: string;
  hint: string;
  // backend step numbers that map to this stage
  steps: number[];
}

const STAGES: Stage[] = [
  { key: 'fetch',   label: 'Reading repository',     hint: 'Cloning metadata, branches, and the file tree',                steps: [1] },
  { key: 'filter',  label: 'Mapping the codebase',   hint: 'Filtering noise — focusing on what matters for onboarding',    steps: [2] },
  { key: 'static',  label: 'Detecting tech stack',   hint: 'Parsing manifests, lockfiles, and config to learn the stack',  steps: [3] },
  { key: 'purpose', label: 'Understanding intent',   hint: 'Reading the README and inferring what this project really does', steps: [4] },
  { key: 'security',label: 'Checking dependencies',  hint: 'Looking at deps and surface area for setup gotchas',           steps: [5, 6] },
  { key: 'roadmap', label: 'Designing your roadmap', hint: 'Asking AI to plan an intelligent onboarding path just for you', steps: [7] },
  { key: 'finalize',label: 'Polishing the checklist',hint: 'Ordering tasks by dependency and writing your first steps',    steps: [8] },
];

function stageIndexForStep(step: number): number {
  for (let i = 0; i < STAGES.length; i++) {
    if (STAGES[i].steps.includes(step)) return i;
  }
  return 0;
}

function LoadingContent() {
  const [progress, setProgress] = useState<AnalysisProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const router = useRouter();
  const searchParams = useSearchParams();
  const repoId = searchParams.get('repoId');
  const repoName = repoIdToDisplayName(repoId);
  const ownerAvatar = repoIdToOwnerAvatar(repoId);
  const ownerRepo = repoIdToOwnerRepo(repoId);

  // Elapsed timer
  useEffect(() => {
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const currentStageIdx = progress ? stageIndexForStep(progress.current_step) : 0;
  const isFinalizing = progress?.current_step === 8 && progress.step_status === 'completed';

  // Subscribe to progress
  useEffect(() => {
    if (!repoId) {
      router.push('/dashboard');
      return;
    }
    const checkExisting = async () => {
      try {
        const r = await fetch(`/api/get-roadmap?repoId=${repoId}&userId=demo-user`);
        if (r.ok) {
          const data = await r.json();
          if (data.roadmap?.sections) {
            router.push(`/tasks?repoId=${repoId}`);
            return true;
          }
        }
      } catch {}
      return false;
    };
    checkExisting().then((exists) => {
      if (exists) return;
      const ref = doc(db, 'analysis_progress', repoId);
      const unsub = onSnapshot(
        ref,
        (snap) => {
          if (snap.exists()) {
            const data = snap.data() as AnalysisProgress;
            setProgress(data);
            if (data.step_status === 'completed' && data.current_step === 8) {
              setTimeout(() => router.push(`/tasks?repoId=${repoId}`), 1200);
            } else if (data.step_status === 'failed') {
              setError('Analysis failed. Please try again.');
            }
          } else {
            setTimeout(() => checkExisting(), 3000);
          }
        },
        () => checkExisting()
      );
      return () => unsub();
    });
  }, [repoId, router]);

  const pct = useMemo(() => {
    if (!progress) return 4;
    return Math.max(4, Math.round((progress.current_step / 8) * 100));
  }, [progress]);

  const elapsedLabel = useMemo(() => {
    const m = Math.floor(elapsed / 60);
    const s = elapsed % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  }, [elapsed]);

  return (
    <div className="relative min-h-screen bg-bg text-fg flex flex-col">
      <div className="absolute inset-0 grid-canvas opacity-40 pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_50%_100%,rgba(242,84,91,0.08),transparent_60%)]" />

      <header className="relative z-10 border-b border-border">
        <div className="mx-auto max-w-4xl px-5 sm:px-8 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted hover:text-fg transition-colors">
            <ArrowLeft size={14} /> Dashboard
          </Link>
          <span className="inline-flex items-center gap-1.5 text-xs text-subtle">
            <Sparkles size={12} className="text-accent" /> AI is analyzing
          </span>
        </div>
      </header>

      <main className="relative z-10 flex-1 px-5 py-10 sm:py-14">
        <div className="mx-auto max-w-2xl">
          {/* Repo header card */}
          <div className="rounded-2xl border border-border bg-surface/40 backdrop-blur-sm p-5 sm:p-6 mb-8">
            <div className="flex items-center gap-4">
              {ownerAvatar ? (
                <img
                  src={ownerAvatar}
                  alt=""
                  className="w-14 h-14 rounded-xl border border-border shrink-0"
                  onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
                />
              ) : (
                <div className="w-14 h-14 rounded-xl border border-border bg-surface-2 grid place-items-center shrink-0">
                  <Github size={20} className="text-muted" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-[11px] uppercase tracking-[0.14em] text-subtle mb-1">Onboarding</p>
                <h1 className="font-serif text-xl sm:text-2xl truncate leading-tight">{repoName}</h1>
                {ownerRepo && (
                  <a
                    href={`https://github.com/${ownerRepo}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-muted hover:text-accent inline-flex items-center gap-1 mt-0.5"
                  >
                    <Github size={11} /> {ownerRepo}
                  </a>
                )}
              </div>
              <div className="hidden sm:flex flex-col items-end shrink-0">
                <span className="text-xs text-subtle">Elapsed</span>
                <span className="font-mono text-sm tabular-nums text-fg">{elapsedLabel}</span>
              </div>
            </div>
          </div>

          {error ? (
            <div className="rounded-2xl border border-accent/30 bg-accent-soft p-6 text-center">
              <AlertCircle size={20} className="mx-auto text-accent mb-3" />
              <p className="text-sm text-fg mb-1 font-medium">Analysis failed</p>
              <p className="text-sm text-muted mb-5">{error}</p>
              <button
                onClick={() => router.push('/dashboard')}
                className="inline-flex items-center gap-1.5 rounded-full bg-accent text-white px-4 py-2 text-sm font-medium hover:bg-accent-hover transition-colors"
              >
                Back to dashboard
              </button>
            </div>
          ) : (
            <>
              {/* Progress strip */}
              <div className="mb-8">
                <div className="flex items-end justify-between mb-2">
                  <div className="min-w-0 pr-3">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-subtle mb-0.5">Now</p>
                    <p className="text-sm text-fg truncate">
                      {isFinalizing ? 'Opening your checklist…' : (STAGES[currentStageIdx]?.label || 'Starting…')}
                    </p>
                  </div>
                  <span className="font-mono text-xs text-muted tabular-nums shrink-0">{pct}%</span>
                </div>
                <div className="relative h-1 rounded-full bg-surface-2 overflow-hidden">
                  <div className="absolute inset-y-0 left-0 bg-accent transition-all duration-700 ease-out" style={{ width: `${pct}%` }} />
                  {pct < 100 && <div className="absolute inset-0 shimmer opacity-60" />}
                </div>
              </div>

              {/* Stages timeline */}
              <ol className="relative space-y-1">
                <div className="absolute left-[15px] top-4 bottom-4 w-px bg-border" />
                {STAGES.map((stage, i) => {
                  const status: 'completed' | 'in-progress' | 'pending' =
                    i < currentStageIdx ? 'completed' :
                    i === currentStageIdx ? (isFinalizing ? 'completed' : 'in-progress') :
                    'pending';
                  return (
                    <li key={stage.key} className="relative flex items-start gap-4 py-2.5">
                      <div className={`relative z-10 w-[30px] h-[30px] rounded-full grid place-items-center shrink-0 transition-colors ${
                        status === 'completed' ? 'bg-accent text-white' :
                        status === 'in-progress' ? 'bg-accent-soft border border-accent' :
                        'bg-surface border border-border'
                      }`}>
                        {status === 'completed' ? <Check size={14} strokeWidth={3} /> :
                         status === 'in-progress' ? <Loader2 size={13} className="animate-spin text-accent" /> :
                         <span className="text-[11px] font-mono text-subtle tabular-nums">{i + 1}</span>}
                      </div>
                      <div className="min-w-0 pt-0.5">
                        <p className={`text-sm leading-tight ${
                          status === 'in-progress' ? 'text-fg font-medium' :
                          status === 'completed' ? 'text-muted' : 'text-subtle'
                        }`}>{stage.label}</p>
                        {status === 'in-progress' && (
                          <p className="text-xs text-muted mt-1 leading-snug">{stage.hint}</p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>

              <div className="mt-10 flex items-center justify-between gap-3 text-xs text-subtle border-t border-border pt-5">
                <span className="sm:hidden font-mono tabular-nums">⏱ {elapsedLabel}</span>
                <span className="hidden sm:inline">Typically ~30s. Larger repos can take a minute.</span>
                <span>Safe to keep this tab open ✦</span>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default function Loading() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Loader2 className="animate-spin text-accent" size={24} />
      </div>
    }>
      <LoadingContent />
    </Suspense>
  );
}
