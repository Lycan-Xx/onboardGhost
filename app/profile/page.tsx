'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/contexts/AuthContext';
import { 
  User as UserIcon, 
  LogOut, 
  Trash2, 
  ArrowLeft, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  BookOpen, 
  Award, 
  Zap, 
  ExternalLink,
  ShieldAlert,
  ChevronRight,
  TrendingUp,
  History
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const GithubIcon = ({ size = 16, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.87-1.54-3.87-1.54-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.68 1.24 3.34.95.1-.74.4-1.24.72-1.53-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.46.11-3.05 0 0 .96-.31 3.15 1.18a10.9 10.9 0 0 1 5.74 0c2.19-1.49 3.15-1.18 3.15-1.18.62 1.59.23 2.76.11 3.05.74.81 1.18 1.84 1.18 3.1 0 4.43-2.69 5.41-5.25 5.69.41.36.78 1.06.78 2.14 0 1.55-.01 2.8-.01 3.18 0 .31.21.67.8.55C20.21 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5z"/>
  </svg>
);

interface AnalysisStats {
  totalRepos: number;
  totalTasks: number;
  completedTasks: number;
  averageProgress: number;
}

export default function Profile() {
  const router = useRouter();
  const { user, loading, hasGitHubToken, githubUser, githubLoading, signOut, initiateGitHubAuth } = useAuth();
  const [stats, setStats] = useState<AnalysisStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (user && hasGitHubToken) {
      fetchStats();
    }
  }, [user, hasGitHubToken]);

  const fetchStats = async () => {
    if (!user) return;
    setLoadingStats(true);
    try {
      const response = await fetch(`/api/user-analyses?userId=${user.uid}`);
      const data = await response.json();
      if (response.ok) {
        const analyses = data.analyses || [];
        const totalRepos = analyses.length;
        const totalTasks = analyses.reduce((sum: number, a: any) => sum + a.total_tasks, 0);
        const completedTasks = analyses.reduce((sum: number, a: any) => sum + a.completed_tasks, 0);
        const averageProgress = totalRepos > 0 
          ? Math.round(analyses.reduce((sum: number, a: any) => sum + a.progress, 0) / totalRepos)
          : 0;
        
        setStats({ totalRepos, totalTasks, completedTasks, averageProgress });
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const handleDeleteAllData = async () => {
    // In a real app, this would call a DELETE API
    alert('This would delete all your stored analyses and progress.');
    setShowDeleteConfirm(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Loader2 className="animate-spin text-accent" size={32} />
      </div>
    );
  }

  const displayName = githubUser?.username || githubUser?.name || (user?.isAnonymous ? 'Guest' : 'You');

  return (
    <div className="relative min-h-screen bg-bg text-fg">
      <div className="absolute inset-0 grid-canvas opacity-40 pointer-events-none" />
      
      {/* Sticky header */}
      <header className="sticky top-0 z-30 border-b border-border bg-bg/80 backdrop-blur-md">
        <div className="mx-auto max-w-5xl px-5 sm:px-8 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted hover:text-fg transition-colors">
            <ArrowLeft size={16} /> Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-accent/20 border border-accent/30 grid place-items-center">
              <span className="text-accent text-[10px] font-bold">◈</span>
            </div>
            <span className="font-semibold tracking-tight text-xs">OnboardGhost</span>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-4xl px-5 sm:px-8 py-10 sm:py-16">
        {/* Profile Hero */}
        <section className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-16">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-tr from-accent to-accent-hover rounded-full opacity-25 blur-lg group-hover:opacity-40 transition-opacity" />
            {githubUser?.avatar ? (
              <img 
                src={githubUser.avatar} 
                alt={displayName} 
                className="relative w-32 h-32 rounded-full border-2 border-border-strong object-cover"
              />
            ) : (
              <div className="relative w-32 h-32 rounded-full border-2 border-border-strong bg-surface grid place-items-center">
                <UserIcon size={48} className="text-muted" />
              </div>
            )}
            {hasGitHubToken && (
              <div className="absolute bottom-1 right-1 bg-bg border border-border-strong rounded-full p-1.5 shadow-lg">
                <GithubIcon size={16} className="text-fg" />
              </div>
            )}
          </div>

          <div className="text-center md:text-left flex-1 min-w-0">
            <h1 className="font-serif text-3xl sm:text-4xl tracking-tight text-fg">{displayName}</h1>
            <p className="mt-1 text-muted text-lg">
              {githubUser?.name && githubUser.name !== githubUser.username ? githubUser.name : 'System Developer'}
            </p>
            
            <div className="mt-6 flex flex-wrap justify-center md:justify-start gap-3">
              {hasGitHubToken ? (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
                  <CheckCircle2 size={14} /> GitHub Connected
                </div>
              ) : (
                <button 
                  onClick={initiateGitHubAuth}
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-fg text-bg text-sm font-medium hover:bg-white/90 transition-colors"
                >
                  <GithubIcon size={14} /> Connect GitHub
                </button>
              )}
              {user?.isAnonymous && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm">
                  <AlertCircle size={14} /> Guest Account
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Stats Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
          <StatCard 
            icon={<BookOpen size={18} />} 
            label="Analyses" 
            value={stats?.totalRepos || 0} 
            loading={loadingStats}
          />
          <StatCard 
            icon={<Zap size={18} />} 
            label="Tasks" 
            value={stats?.totalTasks || 0} 
            loading={loadingStats}
          />
          <StatCard 
            icon={<Award size={18} />} 
            label="Completed" 
            value={stats?.completedTasks || 0} 
            loading={loadingStats}
          />
          <StatCard 
            icon={<TrendingUp size={18} />} 
            label="Avg. Progress" 
            value={`${stats?.averageProgress || 0}%`} 
            loading={loadingStats}
          />
        </section>

        {/* Content Tabs/Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-8">
            <GlassCard label="Account Details">
              <div className="space-y-4">
                <DetailRow label="User ID" value={user?.uid.slice(0, 12) + '...'} mono />
                <DetailRow label="Account Created" value={user?.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : '—'} />
                <DetailRow label="Last Sign In" value={user?.metadata.lastSignInTime ? formatDistanceToNow(new Date(user.metadata.lastSignInTime), { addSuffix: true }) : '—'} />
                <DetailRow label="Provider" value={user?.providerData[0]?.providerId || (user?.isAnonymous ? 'Anonymous' : 'Email')} />
              </div>
            </GlassCard>

            <GlassCard label="Recent History">
              <div className="flex flex-col items-center justify-center py-10 text-center text-subtle border-2 border-dashed border-border rounded-xl">
                 <History size={24} className="mb-2 opacity-50" />
                 <p className="text-sm">Extended activity history coming soon.</p>
              </div>
            </GlassCard>
          </div>

          {/* Sidebar Actions */}
          <aside className="space-y-8">
            <GlassCard label="Preferences">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-fg">Auto-save Progress</span>
                  <div className="w-8 h-4 rounded-full bg-emerald-500 relative cursor-pointer shadow-inner">
                    <div className="absolute right-0.5 top-0.5 w-3 h-3 rounded-full bg-white shadow" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-fg">Ghost Mentor Help</span>
                  <div className="w-8 h-4 rounded-full bg-surface-2 relative cursor-not-allowed">
                    <div className="absolute left-0.5 top-0.5 w-3 h-3 rounded-full bg-muted shadow" />
                  </div>
                </div>
              </div>
            </GlassCard>

            <div className="rounded-2xl border border-accent/20 bg-accent-soft p-6 flex flex-col gap-4">
              <div className="flex items-center gap-2 text-accent">
                <ShieldAlert size={18} />
                <h3 className="text-xs font-bold uppercase tracking-wider">Danger Zone</h3>
              </div>
              <p className="text-[11px] text-accent/80 leading-relaxed">
                Deleting data is permanent. This will clear all repository analyses and progress trackers.
              </p>
              <button 
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-accent/30 text-xs font-semibold text-accent hover:bg-accent hover:text-white transition-all shadow-sm"
              >
                Clear Data History <Trash2 size={14} />
              </button>
              <button 
                onClick={handleSignOut}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-surface-2 border border-border-strong text-xs font-semibold text-fg hover:border-fg transition-all"
              >
                Sign Out <LogOut size={14} />
              </button>
            </div>
          </aside>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5">
           <div className="absolute inset-0 bg-bg/80 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
           <div className="relative w-full max-w-sm bg-surface border border-border shadow-2xl rounded-2xl p-7 text-center">
              <div className="w-12 h-12 bg-accent-soft rounded-full grid place-items-center mx-auto mb-4">
                <ShieldAlert size={24} className="text-accent" />
              </div>
              <h2 className="text-xl font-serif mb-2">Are you sure?</h2>
              <p className="text-sm text-muted mb-6">This will permanently delete all your analyzed repositories and recorded progress. This cannot be undone.</p>
              <div className="flex flex-col gap-2">
                 <button onClick={handleDeleteAllData} className="w-full py-2.5 rounded-full bg-accent text-white font-medium hover:bg-accent-hover transition-colors">
                   Yes, delete everything
                 </button>
                 <button onClick={() => setShowDeleteConfirm(false)} className="w-full py-2.5 rounded-full border border-border text-fg hover:bg-surface-2 transition-colors">
                   Cancel
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, loading }: { icon: React.ReactNode; label: string; value: string | number; loading: boolean }) {
  return (
    <div className="rounded-2xl border border-border bg-surface/40 p-5 backdrop-blur-sm hover:border-accent/40 transition-colors group">
      <div className="flex items-center gap-3 text-muted group-hover:text-accent transition-colors mb-4">
        {icon}
        <span className="text-[10px] uppercase font-bold tracking-widest">{label}</span>
      </div>
      {loading ? (
        <div className="h-8 w-16 bg-surface-2 animate-pulse rounded" />
      ) : (
        <div className="text-2xl font-serif text-fg">{value}</div>
      )}
    </div>
  );
}

function GlassCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-surface/30 backdrop-blur-sm overflow-hidden">
      <div className="px-6 py-3 border-b border-border bg-surface-2/30">
        <h3 className="text-[11px] uppercase tracking-[0.14em] text-subtle font-bold">{label}</h3>
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm py-1">
      <span className="text-muted">{label}</span>
      <span className={`text-fg ${mono ? 'font-mono text-[13px]' : ''}`}>{value}</span>
    </div>
  );
}
