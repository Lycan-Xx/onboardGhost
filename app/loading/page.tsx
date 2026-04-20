'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { repoIdToDisplayName, repoIdToOwnerAvatar } from '@/lib/utils/repo';
import { Check, Loader2, Circle, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface AnalysisProgress {
  current_step: number;
  step_name: string;
  step_status: 'pending' | 'in-progress' | 'completed' | 'failed';
  logs: any[];
  updated_at: any;
}

interface Step { name: string; status: 'completed' | 'in-progress' | 'pending'; }

const STEP_NAMES = [
  'Cloning repository',
  'Parsing file structure',
  'Analyzing dependencies',
  'Scanning security',
  'Generating roadmap',
];

function LoadingContent() {
  const [progress, setProgress] = useState<AnalysisProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [steps, setSteps] = useState<Step[]>(STEP_NAMES.map((n) => ({ name: n, status: 'pending' })));
  const router = useRouter();
  const searchParams = useSearchParams();
  const repoId = searchParams.get('repoId');
  const repoName = repoIdToDisplayName(repoId);
  const ownerAvatar = repoIdToOwnerAvatar(repoId);

  useEffect(() => {
    if (!progress) return;
    const map: { [key: number]: number } = { 1: 0, 2: 1, 3: 2, 4: 2, 5: 3, 6: 4, 7: 4, 8: 4 };
    const idx = map[progress.current_step] || 0;
    setSteps((prev) =>
      prev.map((s, i) => {
        if (i < idx) return { ...s, status: 'completed' };
        if (i === idx) return { ...s, status: progress.step_status === 'completed' ? 'completed' : 'in-progress' };
        return { ...s, status: 'pending' };
      })
    );
  }, [progress]);

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
              setTimeout(() => router.push(`/tasks?repoId=${repoId}`), 1500);
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

  const pct = progress ? Math.round((progress.current_step / 8) * 100) : 0;

  return (
    <div className="relative min-h-screen bg-bg text-fg flex flex-col">
      <div className="absolute inset-0 grid-canvas opacity-40 pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_50%_100%,rgba(242,84,91,0.08),transparent_60%)]" />

      <header className="relative z-10 border-b border-border">
        <div className="mx-auto max-w-3xl px-5 sm:px-8 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted hover:text-fg transition-colors">
            <ArrowLeft size={14} /> Dashboard
          </Link>
          <span className="text-xs text-subtle">Analyzing</span>
        </div>
      </header>

      <main className="relative z-10 flex-1 flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-lg">
          {/* Repo header */}
          <div className="flex items-center gap-3 mb-8">
            {ownerAvatar && (
              <img
                src={ownerAvatar}
                alt=""
                className="w-12 h-12 rounded-lg border border-border"
                onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
              />
            )}
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wider text-subtle">Analyzing</p>
              <h1 className="font-serif text-2xl truncate">{repoName}</h1>
            </div>
          </div>

          {error ? (
            <div className="rounded-xl border border-accent/30 bg-accent-soft p-6 text-center">
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
              {/* Progress bar */}
              <div className="mb-8">
                <div className="flex items-center justify-between text-xs text-muted mb-2">
                  <span>{progress?.step_name || 'Starting…'}</span>
                  <span>{pct}%</span>
                </div>
                <div className="relative h-1 rounded-full bg-surface-2 overflow-hidden">
                  <div className="absolute inset-y-0 left-0 bg-accent transition-all duration-500" style={{ width: `${pct}%` }} />
                  {pct < 100 && <div className="absolute inset-0 shimmer opacity-60" />}
                </div>
              </div>

              {/* Steps timeline */}
              <ol className="relative space-y-1">
                <div className="absolute left-[11px] top-3 bottom-3 w-px bg-border" />
                {steps.map((step, i) => (
                  <li key={i} className="relative flex items-center gap-4 py-2.5 pl-0">
                    <div className={`relative z-10 w-6 h-6 rounded-full grid place-items-center shrink-0 ${
                      step.status === 'completed' ? 'bg-accent text-white' :
                      step.status === 'in-progress' ? 'bg-accent-soft border border-accent' :
                      'bg-surface border border-border'
                    }`}>
                      {step.status === 'completed' ? <Check size={12} strokeWidth={3} /> :
                       step.status === 'in-progress' ? <Loader2 size={11} className="animate-spin text-accent" /> :
                       <Circle size={6} className="text-subtle fill-current" />}
                    </div>
                    <span className={`text-sm ${
                      step.status === 'in-progress' ? 'text-fg font-medium' :
                      step.status === 'completed' ? 'text-muted' : 'text-subtle'
                    }`}>{step.name}</span>
                  </li>
                ))}
              </ol>

              <p className="mt-10 text-xs text-subtle text-center">
                This usually takes about 30 seconds — feel free to keep this tab open.
              </p>
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
