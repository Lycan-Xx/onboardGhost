'use client';

import { useEffect, useState, Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import GhostMentorChat from '@/components/GhostMentorChat';
import Link from 'next/link';
import { useAuth } from '@/lib/contexts/AuthContext';
import { repoIdToOwnerAvatar, repoIdToOwnerRepo } from '@/lib/utils/repo';
import {
  TaskSteps,
  CommandBlocks,
  CodeBlocks,
  TipsSection,
  WarningsSection,
  ReferencesSection,
} from '@/components/TaskComponents';
import {
  ArrowLeft, ArrowRight, Check, ChevronDown, ChevronRight,
  Loader2, Clock, AlertCircle, User as UserIcon, Sparkles,
} from 'lucide-react';

interface TaskDescription { summary: string; why_needed: string; learning_goal: string; }
interface OSSpecific { mac?: string; windows?: string; linux?: string; }
interface TaskStep { order: number; action: string; details: string; os_specific: OSSpecific | null; }
interface CommandBlock { command: string; description: string; expected_output: string; os: 'all' | 'mac' | 'windows' | 'linux'; }
interface CodeBlock { type: 'file_content' | 'snippet' | 'configuration'; file_path?: string; language: string; content: string; explanation: string; highlights?: { line: number; text: string; type: 'info' | 'warning' | 'error' }[]; }
interface Reference { text: string; url: string; type: 'documentation' | 'tutorial' | 'tool' | 'external'; relevance: string; }
interface Tip { text: string; type: 'pro_tip' | 'beginner_friendly' | 'time_saver'; emphasis: string[]; }
interface Warning { text: string; severity: 'critical' | 'important' | 'minor'; os_specific: boolean; emphasis: string[]; }
interface Task {
  id: string;
  title: string;
  description: string | TaskDescription;
  instructions?: string | string[];
  steps?: TaskStep[];
  commands?: string[] | CommandBlock[];
  code_snippets?: any[];
  code_blocks?: CodeBlock[];
  references?: Reference[];
  tips?: string[] | Tip[];
  warnings?: string[] | Warning[];
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'easy' | 'medium' | 'hard';
  estimated_time: string;
  depends_on?: string[];
}
interface Section { id: string; title: string; description: string; tasks: Task[]; }
interface Roadmap { repository_name: string; total_tasks: number; estimated_completion_time: string; sections: Section[]; }
interface Progress { completed_tasks: string[]; overall_progress_percentage: number; ghost_solidness: number; }

const GhIcon = ({ size = 16, className = '' }: { size?: number; className?: string }) => (
  <svg viewBox="0 0 16 16" width={size} height={size} fill="currentColor" className={className} aria-hidden>
    <path fillRule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
  </svg>
);

function difficultyColor(d?: string) {
  if (!d) return 'text-muted';
  if (['beginner', 'easy'].includes(d)) return 'text-emerald-400';
  if (['intermediate', 'medium'].includes(d)) return 'text-amber-400';
  return 'text-accent';
}

function TasksContent() {
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);
  const searchParams = useSearchParams();
  const repoId = searchParams.get('repoId');
  const { user } = useAuth();
  const ownerAvatar = repoIdToOwnerAvatar(repoId);
  const ownerRepo = repoIdToOwnerRepo(repoId);

  useEffect(() => {
    if (!repoId) {
      setError('Repository ID is required');
      setLoading(false);
      return;
    }
    fetchRoadmap();
  }, [repoId]);

  const fetchRoadmap = async () => {
    try {
      const response = await fetch(`/api/get-roadmap?repoId=${repoId}&userId=${user?.uid || 'demo-user'}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch roadmap');
      setRoadmap(data.roadmap);
      setProgress(data.progress);
      if (data.roadmap.sections.length > 0) {
        const firstIncompleteTask = data.roadmap.sections
          .flatMap((s: Section) => s.tasks)
          .find((t: Task) => !data.progress.completed_tasks.includes(t.id));
        setSelectedTaskId(firstIncompleteTask?.id || data.roadmap.sections[0].tasks[0]?.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleTaskToggle = async (taskId: string, completed: boolean) => {
    try {
      const response = await fetch('/api/update-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.uid || 'demo-user', repoId, taskId, completed }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update task');
      if (progress) {
        const newCompletedTasks = completed
          ? [...progress.completed_tasks, taskId]
          : progress.completed_tasks.filter(id => id !== taskId);
        setProgress({
          ...progress,
          completed_tasks: newCompletedTasks,
          overall_progress_percentage: data.newProgress,
          ghost_solidness: data.newProgress,
        });
      }
      if (completed && roadmap) {
        const allTasks = roadmap.sections.flatMap(s => s.tasks);
        const currentIndex = allTasks.findIndex(t => t.id === taskId);
        const nextTask = allTasks.slice(currentIndex + 1).find(t => !progress?.completed_tasks.includes(t.id));
        if (nextTask) setTimeout(() => setSelectedTaskId(nextTask.id), 300);
      }
    } catch (err) {
      console.error('Failed to update task:', err);
    }
  };

  const isTaskCompleted = (taskId: string) => progress?.completed_tasks.includes(taskId) || false;

  const selectedTask = useMemo(
    () => roadmap?.sections.flatMap(s => s.tasks).find(t => t.id === selectedTaskId),
    [roadmap, selectedTaskId]
  );
  const selectedSection = useMemo(
    () => roadmap?.sections.find(s => s.tasks.some(t => t.id === selectedTaskId)),
    [roadmap, selectedTaskId]
  );

  const toggleSection = (id: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const getNextTask = (): Task | null => {
    if (!roadmap || !selectedTaskId) return null;
    const all = roadmap.sections.flatMap(s => s.tasks);
    const idx = all.findIndex(t => t.id === selectedTaskId);
    return all.slice(idx + 1).find(t => !isTaskCompleted(t.id)) || null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Loader2 className="animate-spin text-accent" size={28} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-5">
        <div className="text-center max-w-sm">
          <AlertCircle className="mx-auto text-accent mb-3" size={22} />
          <p className="text-fg mb-2">Couldn't load your roadmap</p>
          <p className="text-sm text-muted mb-6">{error}</p>
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 rounded-full bg-accent text-white px-4 py-2 text-sm font-medium hover:bg-accent-hover transition-colors">
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!roadmap) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <p className="text-muted">No roadmap found</p>
      </div>
    );
  }

  const totalTasks = roadmap.sections.reduce((s, sec) => s + sec.tasks.length, 0);
  const completedCount = progress?.completed_tasks.length || 0;
  const pct = progress?.overall_progress_percentage || 0;
  const nextTask = getNextTask();

  return (
    <div className="relative min-h-screen bg-bg text-fg">
      <div className="absolute inset-0 grid-canvas opacity-40 pointer-events-none" />

      {/* Sticky header */}
      <header className="sticky top-0 z-30 border-b border-border bg-bg/80 backdrop-blur-md">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-10">
          <div className="h-14 flex items-center justify-between gap-4">
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted hover:text-fg transition-colors shrink-0">
              <ArrowLeft size={14} /> <span className="hidden sm:inline">Dashboard</span>
            </Link>
            <div className="flex items-center gap-3 min-w-0 flex-1 justify-center">
              {ownerAvatar && (
                <img src={ownerAvatar} alt="" className="w-7 h-7 rounded-md border border-border shrink-0"
                  onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />
              )}
              <div className="min-w-0 text-center">
                <p className="text-sm font-medium truncate leading-tight">{roadmap.repository_name}</p>
                {ownerRepo && (
                  <a href={`https://github.com/${ownerRepo}`} target="_blank" rel="noreferrer"
                    className="text-[11px] text-subtle hover:text-accent inline-flex items-center gap-1">
                    <GhIcon size={9} /> {ownerRepo}
                  </a>
                )}
              </div>
            </div>
            <Link href="/profile" className="inline-flex items-center gap-2 text-sm text-muted hover:text-fg transition-colors shrink-0">
              <UserIcon size={14} /> <span className="hidden sm:inline">Profile</span>
            </Link>
          </div>

          {/* Progress meter */}
          <div className="pb-3">
            <div className="flex items-center justify-between text-[11px] text-subtle mb-1.5">
              <span><span className="text-fg font-medium">{completedCount}</span> / {totalTasks} tasks</span>
              <span className="font-mono tabular-nums">{pct}%</span>
            </div>
            <div className="relative h-1 rounded-full bg-surface-2 overflow-hidden">
              <div className="absolute inset-y-0 left-0 bg-accent transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>
      </header>

      {/* Mobile section toggle */}
      <div className="lg:hidden sticky top-[88px] z-20 border-b border-border bg-bg/80 backdrop-blur-md">
        <button
          onClick={() => setMobilePanelOpen(v => !v)}
          className="w-full px-4 py-2.5 flex items-center justify-between text-sm"
        >
          <span className="text-muted">View checklist</span>
          <ChevronDown size={16} className={`text-muted transition-transform ${mobilePanelOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      <main className="relative mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-10 py-6 lg:py-8 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 pb-32">
        {/* Left rail — sections + tasks */}
        <aside className={`lg:col-span-4 xl:col-span-3 ${mobilePanelOpen ? 'block' : 'hidden lg:block'} lg:sticky lg:top-[120px] lg:self-start lg:max-h-[calc(100vh-140px)] lg:overflow-y-auto scrollbar-thin pr-1`}>
          <div className="space-y-4">
            {roadmap.sections.map((section, sIdx) => {
              const collapsed = collapsedSections.has(section.id);
              const sectionDone = section.tasks.filter(t => isTaskCompleted(t.id)).length;
              const sectionTotal = section.tasks.length;
              const sectionPct = sectionTotal ? Math.round((sectionDone / sectionTotal) * 100) : 0;
              return (
                <div key={section.id} className="rounded-xl border border-border bg-surface/40 overflow-hidden">
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-surface-2/40 transition-colors"
                  >
                    <span className="font-mono text-[11px] text-subtle tabular-nums w-5 shrink-0">
                      {String(sIdx + 1).padStart(2, '0')}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-medium text-fg leading-tight truncate">{section.title}</span>
                      <span className="block text-[11px] text-subtle mt-0.5">
                        {sectionDone}/{sectionTotal} done
                      </span>
                    </span>
                    {sectionPct === 100 && <Check size={14} className="text-emerald-400 shrink-0" />}
                    <ChevronRight size={14} className={`text-subtle shrink-0 transition-transform ${collapsed ? '' : 'rotate-90'}`} />
                  </button>
                  {!collapsed && (
                    <ul className="px-2 pb-2 space-y-0.5">
                      {section.tasks.map((task, tIdx) => {
                        const done = isTaskCompleted(task.id);
                        const selected = selectedTaskId === task.id;
                        return (
                          <li key={task.id}>
                            <button
                              onClick={() => { setSelectedTaskId(task.id); setMobilePanelOpen(false); }}
                              className={`w-full text-left flex items-start gap-3 px-3 py-2 rounded-lg transition-colors group ${
                                selected ? 'bg-accent-soft' : 'hover:bg-surface-2/40'
                              }`}
                            >
                              <span
                                role="checkbox"
                                aria-checked={done}
                                onClick={(e) => { e.stopPropagation(); handleTaskToggle(task.id, !done); }}
                                className={`mt-0.5 w-[18px] h-[18px] rounded-md border grid place-items-center shrink-0 transition-colors cursor-pointer ${
                                  done ? 'bg-accent border-accent text-white' : 'border-border-strong hover:border-accent'
                                }`}
                              >
                                {done && <Check size={11} strokeWidth={3} />}
                              </span>
                              <span className="flex-1 min-w-0">
                                <span className={`block text-sm leading-snug ${
                                  done ? 'text-subtle line-through' : selected ? 'text-fg font-medium' : 'text-muted group-hover:text-fg'
                                }`}>
                                  {task.title}
                                </span>
                                {task.estimated_time && (
                                  <span className="inline-flex items-center gap-1 mt-1 text-[10px] text-subtle">
                                    <Clock size={9} /> {task.estimated_time}
                                  </span>
                                )}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        {/* Main — task detail */}
        <section className="lg:col-span-8 xl:col-span-9 min-w-0">
          {selectedTask ? (
            <article className="rounded-2xl border border-border bg-surface/40 backdrop-blur-sm overflow-hidden">
              {/* Task header */}
              <div className="px-6 sm:px-8 pt-6 sm:pt-8 pb-5 border-b border-border">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-subtle mb-3">
                  <span>{selectedSection?.title || 'Task'}</span>
                  {selectedTask.difficulty && (
                    <>
                      <span className="text-border">·</span>
                      <span className={difficultyColor(selectedTask.difficulty)}>{selectedTask.difficulty}</span>
                    </>
                  )}
                  {selectedTask.estimated_time && (
                    <>
                      <span className="text-border">·</span>
                      <span className="inline-flex items-center gap-1"><Clock size={10} /> {selectedTask.estimated_time}</span>
                    </>
                  )}
                </div>
                <h2 className="font-serif text-2xl sm:text-3xl text-fg leading-tight">{selectedTask.title}</h2>

                {/* Description */}
                {typeof selectedTask.description === 'string' ? (
                  <p className="mt-3 text-muted leading-relaxed">{selectedTask.description}</p>
                ) : (
                  <div className="mt-3 space-y-2">
                    <p className="text-muted leading-relaxed">{selectedTask.description.summary}</p>
                    {selectedTask.description.why_needed && (
                      <p className="text-sm text-subtle italic">{selectedTask.description.why_needed}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Body */}
              <div className="px-6 sm:px-8 py-6 space-y-7">
                {selectedTask.steps && selectedTask.steps.length > 0 && (
                  <Block label="Steps"><TaskSteps steps={selectedTask.steps} /></Block>
                )}
                {selectedTask.commands && selectedTask.commands.length > 0 && (
                  <Block label="Commands"><CommandBlocks commands={selectedTask.commands} /></Block>
                )}
                {selectedTask.code_blocks && selectedTask.code_blocks.length > 0 && (
                  <Block label="Code"><CodeBlocks codeBlocks={selectedTask.code_blocks} /></Block>
                )}
                {selectedTask.tips && selectedTask.tips.length > 0 && (
                  <Block label="Tips" accent="emerald"><TipsSection tips={selectedTask.tips} /></Block>
                )}
                {selectedTask.warnings && selectedTask.warnings.length > 0 && (
                  <Block label="Watch out" accent="amber"><WarningsSection warnings={selectedTask.warnings} /></Block>
                )}
                {selectedTask.references && selectedTask.references.length > 0 && (
                  <Block label="References"><ReferencesSection references={selectedTask.references} /></Block>
                )}
              </div>

              {/* Footer actions */}
              <div className="px-6 sm:px-8 py-5 border-t border-border bg-surface-2/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <button
                  onClick={() => handleTaskToggle(selectedTask.id, !isTaskCompleted(selectedTask.id))}
                  className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                    isTaskCompleted(selectedTask.id)
                      ? 'bg-surface-2 text-muted hover:text-fg'
                      : 'bg-accent text-white hover:bg-accent-hover'
                  }`}
                >
                  {isTaskCompleted(selectedTask.id) ? (
                    <>Mark as incomplete</>
                  ) : (
                    <><Check size={15} strokeWidth={3} /> Mark complete</>
                  )}
                </button>
                {nextTask && (
                  <button
                    onClick={() => setSelectedTaskId(nextTask.id)}
                    className="inline-flex items-center justify-center gap-1.5 text-sm text-muted hover:text-fg transition-colors"
                  >
                    Next: <span className="text-fg max-w-[200px] truncate">{nextTask.title}</span>
                    <ArrowRight size={14} />
                  </button>
                )}
              </div>
            </article>
          ) : (
            <div className="rounded-2xl border border-border bg-surface/40 p-12 text-center">
              <Sparkles size={20} className="mx-auto text-accent mb-3" />
              <p className="text-muted">Select a task to begin.</p>
            </div>
          )}
        </section>
      </main>

      {repoId && <GhostMentorChat repoId={repoId} userId={user?.uid || 'demo-user'} />}
    </div>
  );
}

function Block({
  label, children, accent,
}: { label: string; children: React.ReactNode; accent?: 'emerald' | 'amber' }) {
  const dot =
    accent === 'emerald' ? 'bg-emerald-400' :
    accent === 'amber'   ? 'bg-amber-400'   :
    'bg-accent';
  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
        <h3 className="text-[11px] uppercase tracking-[0.14em] text-subtle">{label}</h3>
      </div>
      <div className="text-fg">{children}</div>
    </section>
  );
}

export default function Tasks() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Loader2 className="animate-spin text-accent" size={24} />
      </div>
    }>
      <TasksContent />
    </Suspense>
  );
}
