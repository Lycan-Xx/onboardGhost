'use client';

import { useEffect, useState, Suspense, useRef, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/contexts/AuthContext';
import { repoIdToDisplayName, repoIdToOwnerAvatar } from '@/lib/utils/repo';
import {
  ArrowRight, Search, Trash2, Loader2, FolderOpen,
  ChevronRight, Lock, AlertCircle, X
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const GithubIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.87-1.54-3.87-1.54-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.68 1.24 3.34.95.1-.74.4-1.24.72-1.53-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.46.11-3.05 0 0 .96-.31 3.15 1.18a10.9 10.9 0 0 1 5.74 0c2.19-1.49 3.15-1.18 3.15-1.18.62 1.59.23 2.76.11 3.05.74.81 1.18 1.84 1.18 3.1 0 4.43-2.69 5.41-5.25 5.69.41.36.78 1.06.78 2.14 0 1.55-.01 2.8-.01 3.18 0 .31.21.67.8.55C20.21 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5z"/>
  </svg>
);

interface Analysis {
  repoId: string;
  repository_name: string;
  progress: number;
  started_at: any;
  last_activity: any;
  total_tasks: number;
  completed_tasks: number;
}

interface Repo {
  id: number;
  name: string;
  fullName: string;
  url: string;
  description: string | null;
  private: boolean;
  language: string | null;
  updatedAt: string;
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    user, loading: authLoading, isAuthenticated,
    hasGitHubToken, githubUser, githubLoading,
    googleLoading, signInWithGoogle, initiateGitHubAuth,
  } = useAuth();

  const [repoUrl, setRepoUrl] = useState(searchParams.get('prefill') || '');
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loadingAnalyses, setLoadingAnalyses] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [repositories, setRepositories] = useState<Repo[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // OAuth callback handling
  useEffect(() => {
    const oauth = searchParams.get('oauth');
    const errorParam = searchParams.get('error');
    if (oauth === 'success') {
      setError(null);
      if (user) fetchAnalyses();
    } else if (errorParam === 'oauth_not_configured') {
      setError('GitHub OAuth is not configured. Please check setup instructions.');
    } else if (errorParam) {
      setError('GitHub authentication failed. Please try again.');
    }
  }, [searchParams, user]);

  // Fetch data when authenticated with GitHub
  useEffect(() => {
    if (isAuthenticated && hasGitHubToken) {
      fetchAnalyses();
      fetchRepositories();
    }
  }, [isAuthenticated, hasGitHubToken]);

  const fetchAnalyses = async () => {
    if (!user) return;
    setLoadingAnalyses(true);
    try {
      const response = await fetch(`/api/user-analyses?userId=${user.uid}`);
      const data = await response.json();
      if (response.ok) setAnalyses(data.analyses || []);
    } catch (err) {
      console.error('Error fetching analyses:', err);
    } finally {
      setLoadingAnalyses(false);
    }
  };

  const fetchRepositories = async () => {
    if (!user) return;
    setLoadingRepos(true);
    try {
      const response = await fetch(`/api/github/repos?userId=${user.uid}`);
      const data = await response.json();
      if (response.ok) setRepositories(data.repositories || []);
    } catch (err) {
      console.error('Error fetching repositories:', err);
    } finally {
      setLoadingRepos(false);
    }
  };

  const handleAnalyze = async () => {
    if (!repoUrl.trim()) {
      setError('Please enter a repository URL');
      return;
    }
    if (hasGitHubToken && analyses.length >= 2) {
      setError('You have reached the maximum of 2 analyses. Please delete one to continue.');
      return;
    }

    setAnalyzing(true);
    setError(null);

    try {
      const repoId = repoUrl.replace('https://github.com/', '').replace('/', '-');
      let githubToken = null;
      if (hasGitHubToken && user) {
        try {
          const tokenResponse = await fetch(`/api/github/token?userId=${user.uid}`);
          if (tokenResponse.ok) githubToken = (await tokenResponse.json()).token;
        } catch {}
      }

      router.push(`/loading?repoId=${repoId}`);
      fetch('/api/analyze-repo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoUrl,
          userId: user?.uid || 'demo-user',
          saveProgress: true,
          githubToken,
        }),
      }).catch((err) => console.error('Analysis error:', err));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setAnalyzing(false);
    }
  };

  const handleDelete = async (repoId: string) => {
    if (!user) return;
    try {
      const response = await fetch('/api/delete-analysis', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, repoId }),
      });
      if (response.ok) {
        setAnalyses(analyses.filter((a) => a.repoId !== repoId));
        setDeleteConfirm(null);
      } else {
        setError('Failed to delete analysis');
      }
    } catch {
      setError('Failed to delete analysis');
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter / slice repos: top 15 most recent by default; filtered when typing
  const visibleRepos = useMemo(() => {
    const trimmed = repoUrl.trim().toLowerCase();
    const isUrl = trimmed.startsWith('http');
    if (!trimmed || isUrl) return repositories.slice(0, 15);
    return repositories
      .filter(
        (r) =>
          r.fullName.toLowerCase().includes(trimmed) ||
          r.description?.toLowerCase().includes(trimmed)
      )
      .slice(0, 15);
  }, [repositories, repoUrl]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Loader2 className="animate-spin text-accent" size={28} />
      </div>
    );
  }

  // Unauthenticated → sign-in card
  if (!isAuthenticated || (!hasGitHubToken && !user?.isAnonymous)) {
    return (
      <SignInGate
        onGoogle={signInWithGoogle}
        onGitHub={initiateGitHubAuth}
        googleLoading={googleLoading}
        githubLoading={githubLoading}
      />
    );
  }

  const displayName = githubUser?.username || githubUser?.name || (user?.isAnonymous ? 'Guest' : 'You');

  return (
    <div className="relative min-h-screen bg-bg text-fg">
      <div className="absolute inset-0 grid-canvas opacity-50 pointer-events-none" />

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-border">
          <div className="mx-auto max-w-6xl px-5 sm:px-8 h-14 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-md bg-accent/20 border border-accent/30 grid place-items-center">
                <span className="text-accent text-sm font-semibold">◈</span>
              </div>
              <span className="font-semibold tracking-tight text-sm">OnboardGhost</span>
            </Link>

            {/* Profile pill / sign-in */}
            {hasGitHubToken && githubUser ? (
              <Link
                href="/profile"
                className="flex items-center gap-2.5 pl-1 pr-3 py-1 rounded-full bg-surface border border-border hover:border-border-strong transition-colors group"
              >
                <img
                  src={githubUser.avatar}
                  alt={githubUser.username}
                  className="w-7 h-7 rounded-full object-cover"
                />
                <span className="text-sm text-fg max-w-[120px] truncate">
                  {githubUser.username || githubUser.name}
                </span>
                <ChevronRight size={14} className="text-muted group-hover:text-fg transition-colors" />
              </Link>
            ) : (
              <button
                onClick={initiateGitHubAuth}
                disabled={githubLoading}
                className="inline-flex items-center gap-2 rounded-full bg-fg text-bg px-4 py-1.5 text-sm font-medium hover:bg-white/90 transition-colors disabled:opacity-60"
              >
                {githubLoading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Redirecting…
                  </>
                ) : (
                  <>
                    <GithubIcon size={14} />
                    Sign in with GitHub
                  </>
                )}
              </button>
            )}
          </div>
        </header>

        {/* Hero */}
        <main className="mx-auto max-w-5xl px-5 sm:px-8 py-12 sm:py-16">
          <div className="mb-10">
            <h1 className="font-serif text-3xl sm:text-4xl tracking-tight">
              {hasGitHubToken ? `Welcome back, ${displayName}` : 'Welcome'}
            </h1>
            <p className="mt-2 text-muted text-sm sm:text-base">
              Pick a repository to analyze, or paste a GitHub URL.
            </p>
          </div>

          {/* Unified combobox */}
          <div ref={dropdownRef} className="relative max-w-2xl">
            <div className="flex items-center gap-2 rounded-full bg-surface border border-border-strong p-1.5 focus-within:border-accent/50 transition-colors">
              <Search size={16} className="ml-3 text-muted shrink-0" />
              <input
                type="text"
                value={repoUrl}
                onChange={(e) => {
                  setRepoUrl(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                placeholder={hasGitHubToken ? 'Search your repos or paste a URL…' : 'Paste a public GitHub repo URL…'}
                className="flex-1 bg-transparent px-1 py-2 text-sm placeholder:text-subtle outline-none"
                disabled={analyzing}
              />
              <button
                onClick={handleAnalyze}
                disabled={analyzing || !repoUrl.trim()}
                className="inline-flex items-center gap-1.5 rounded-full bg-accent text-white px-4 py-2 text-sm font-medium hover:bg-accent-hover transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                {analyzing ? <Loader2 size={14} className="animate-spin" /> : <>Analyze <ArrowRight size={14} /></>}
              </button>
            </div>

            {/* Dropdown */}
            {hasGitHubToken && showDropdown && (
              <div className="absolute z-20 left-0 right-0 mt-2 rounded-xl bg-surface border border-border-strong shadow-2xl max-h-[360px] overflow-y-auto scrollbar-thin">
                {loadingRepos ? (
                  <div className="p-6 text-center text-sm text-muted">
                    <Loader2 size={16} className="inline animate-spin mr-2" /> Loading repositories…
                  </div>
                ) : visibleRepos.length === 0 ? (
                  <div className="p-6 text-center text-sm text-muted">No matching repositories</div>
                ) : (
                  <>
                    <div className="px-4 py-2 text-[11px] uppercase tracking-wider text-subtle border-b border-border">
                      {repoUrl.trim() ? 'Matches' : 'Recent repositories'}
                    </div>
                    {visibleRepos.map((repo) => (
                      <button
                        key={repo.id}
                        onClick={() => {
                          setRepoUrl(repo.url);
                          setShowDropdown(false);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-surface-2 transition-colors border-b border-border last:border-0 group"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-fg truncate">{repo.fullName}</span>
                          {repo.private && (
                            <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-accent-soft text-accent">
                              <Lock size={9} /> Private
                            </span>
                          )}
                        </div>
                        {repo.description && (
                          <p className="text-xs text-muted mt-0.5 truncate">{repo.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-1 text-[11px] text-subtle">
                          {repo.language && <span>{repo.language}</span>}
                          {repo.updatedAt && (
                            <span>Updated {formatDistanceToNow(new Date(repo.updatedAt), { addSuffix: true })}</span>
                          )}
                        </div>
                      </button>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Demo chips */}
          <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-muted max-w-2xl">
            <span>Try a demo:</span>
            {[
              { name: 'React', url: 'https://github.com/facebook/react' },
              { name: 'Next.js', url: 'https://github.com/vercel/next.js' },
              { name: 'Redux', url: 'https://github.com/reduxjs/redux' },
            ].map((d) => (
              <button
                key={d.name}
                onClick={() => setRepoUrl(d.url)}
                className="rounded-full border border-border px-3 py-1 hover:border-accent/60 hover:text-fg transition-colors"
              >
                {d.name}
              </button>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="mt-5 max-w-2xl flex items-start gap-2 rounded-lg border border-accent/30 bg-accent-soft px-4 py-3 text-sm text-accent">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <p className="flex-1">{error}</p>
              <button onClick={() => setError(null)}><X size={14} /></button>
            </div>
          )}

          {/* Recent Analyses */}
          {hasGitHubToken && (
            <section className="mt-16">
              <div className="flex items-baseline justify-between mb-5">
                <h2 className="font-serif text-2xl">Recent analyses</h2>
                <span className="text-xs text-subtle">{analyses.length}/2 used</span>
              </div>

              {loadingAnalyses ? (
                <div className="text-center py-12 text-muted text-sm">
                  <Loader2 size={18} className="inline animate-spin mr-2" /> Loading…
                </div>
              ) : analyses.length === 0 ? (
                <div className="text-center py-16 rounded-xl border border-dashed border-border">
                  <FolderOpen size={32} className="mx-auto text-subtle mb-3" />
                  <p className="text-sm text-muted">No analyses yet</p>
                  <p className="text-xs text-subtle mt-1">Pick a repository above to begin</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analyses.map((a) => {
                    const name = a.repository_name || repoIdToDisplayName(a.repoId);
                    const avatar = repoIdToOwnerAvatar(a.repoId);
                    const lastActivity = a.last_activity?.seconds
                      ? new Date(a.last_activity.seconds * 1000)
                      : a.last_activity ? new Date(a.last_activity) : null;

                    return (
                      <div
                        key={a.repoId}
                        className="relative rounded-xl bg-surface border border-border hover:border-border-strong transition-colors p-5 group"
                      >
                        {deleteConfirm === a.repoId ? (
                          <div className="absolute inset-0 rounded-xl bg-bg/95 backdrop-blur flex flex-col items-center justify-center p-5 z-10">
                            <p className="text-sm text-fg mb-1">Delete this analysis?</p>
                            <p className="text-xs text-muted text-center mb-4">{name}</p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleDelete(a.repoId)}
                                className="px-3 py-1.5 text-xs rounded-md bg-accent text-white hover:bg-accent-hover"
                              >
                                Delete
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                className="px-3 py-1.5 text-xs rounded-md border border-border hover:border-border-strong"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : null}

                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0">
                            {avatar && (
                              <img
                                src={avatar}
                                alt=""
                                className="w-9 h-9 rounded-md border border-border shrink-0"
                                onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
                              />
                            )}
                            <div className="min-w-0">
                              <h3 className="text-sm font-medium text-fg truncate">{name}</h3>
                              <p className="text-xs text-subtle mt-0.5">
                                {lastActivity ? `Updated ${formatDistanceToNow(lastActivity, { addSuffix: true })}` : '—'}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => setDeleteConfirm(a.repoId)}
                            className="text-subtle hover:text-accent opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-label="Delete"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>

                        <div className="mt-4">
                          <div className="flex items-center justify-between text-xs text-muted mb-1.5">
                            <span>{a.completed_tasks}/{a.total_tasks} tasks</span>
                            <span>{a.progress}%</span>
                          </div>
                          <div className="h-1 rounded-full bg-surface-2 overflow-hidden">
                            <div
                              className="h-full bg-accent transition-all duration-500"
                              style={{ width: `${a.progress}%` }}
                            />
                          </div>
                        </div>

                        <button
                          onClick={() => router.push(`/tasks?repoId=${a.repoId}`)}
                          className="mt-4 inline-flex items-center gap-1.5 text-sm text-accent hover:text-accent-hover font-medium"
                        >
                          Continue <ArrowRight size={13} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

function SignInGate({
  onGoogle, onGitHub, googleLoading, githubLoading,
}: {
  onGoogle: () => void;
  onGitHub: () => void;
  googleLoading: boolean;
  githubLoading: boolean;
}) {
  return (
    <div className="relative min-h-screen bg-bg flex items-center justify-center px-5">
      <div className="absolute inset-0 grid-canvas opacity-40 pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_50%_100%,rgba(242,84,91,0.10),transparent_60%)]" />

      <div className="relative z-10 w-full max-w-sm">
        <Link href="/" className="flex items-center gap-2 justify-center mb-10">
          <div className="h-8 w-8 rounded-md bg-accent/20 border border-accent/30 grid place-items-center">
            <span className="text-accent text-sm font-semibold">◈</span>
          </div>
          <span className="font-semibold tracking-tight">OnboardGhost</span>
        </Link>

        <div className="rounded-xl bg-surface border border-border p-7">
          <h1 className="font-serif text-2xl text-center">Sign in to continue</h1>
          <p className="text-sm text-muted text-center mt-1.5">
            Choose how you'd like to access your roadmaps.
          </p>

          <div className="mt-7 space-y-2.5">
            <button
              onClick={onGitHub}
              disabled={githubLoading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-fg text-bg py-2.5 text-sm font-medium hover:bg-white/90 transition-colors disabled:opacity-60"
            >
              {githubLoading ? (
                <><Loader2 size={15} className="animate-spin" /> Redirecting to GitHub…</>
              ) : (
                <><GithubIcon size={15} /> Continue with GitHub</>
              )}
            </button>

            <button
              onClick={onGoogle}
              disabled={googleLoading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-surface-2 border border-border-strong text-fg py-2.5 text-sm font-medium hover:border-border-strong hover:bg-surface transition-colors disabled:opacity-60"
            >
              {googleLoading ? (
                <><Loader2 size={15} className="animate-spin" /> Opening Google…</>
              ) : (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                  Continue with Google
                </>
              )}
            </button>
          </div>

          <p className="mt-6 text-[11px] text-subtle text-center leading-relaxed">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>

        <Link
          href="/"
          className="block mt-6 text-center text-xs text-muted hover:text-fg transition-colors"
        >
          ← Back to home
        </Link>
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Loader2 className="animate-spin text-accent" size={28} />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
