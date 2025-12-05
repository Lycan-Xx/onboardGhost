'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import GhostMentorChat from '@/components/GhostMentorChat';
import Link from 'next/link';
import { 
  TaskSteps, 
  CommandBlocks, 
  CodeBlocks, 
  TipsSection, 
  WarningsSection, 
  ReferencesSection,
  // VerificationSection // Commented out until data is populated
} from '@/components/TaskComponents';

interface TaskDescription {
  summary: string;
  why_needed: string;
  learning_goal: string;
}

interface OSSpecific {
  mac?: string;
  windows?: string;
  linux?: string;
}

interface TaskStep {
  order: number;
  action: string;
  details: string;
  os_specific: OSSpecific | null;
}

interface CommandBlock {
  command: string;
  description: string;
  expected_output: string;
  os: 'all' | 'mac' | 'windows' | 'linux';
}

interface CodeBlock {
  type: 'file_content' | 'snippet' | 'configuration';
  file_path?: string;
  language: string;
  content: string;
  explanation: string;
  highlights?: Array<{
    line: number;
    text: string;
    type: 'info' | 'warning' | 'error';
  }>;
}

interface Reference {
  text: string;
  url: string;
  type: 'documentation' | 'tutorial' | 'tool' | 'external';
  relevance: string;
}

interface Tip {
  text: string;
  type: 'pro_tip' | 'beginner_friendly' | 'time_saver';
  emphasis: string[];
}

interface Warning {
  text: string;
  severity: 'critical' | 'important' | 'minor';
  os_specific: boolean;
  emphasis: string[];
}

interface Verification {
  how_to_verify: string;
  expected_result: string;
  troubleshooting: Array<{
    problem: string;
    solution: string;
    command: string | null;
  }>;
}

interface Task {
  id: string;
  title: string;
  description: string | TaskDescription;
  instructions?: string | string[];
  steps?: TaskStep[];
  commands?: string[] | CommandBlock[];
  code_snippets?: (string | { file?: string; language?: string; code: string })[];
  code_blocks?: CodeBlock[];
  references?: Reference[];
  tips?: string[] | Tip[];
  warnings?: string[] | Warning[];
  verification?: Verification;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'easy' | 'medium' | 'hard';
  estimated_time: string;
  depends_on?: string[];
}

interface Section {
  id: string;
  title: string;
  description: string;
  tasks: Task[];
}

interface Roadmap {
  repository_name: string;
  total_tasks: number;
  estimated_completion_time: string;
  sections: Section[];
}

interface Progress {
  completed_tasks: string[];
  overall_progress_percentage: number;
  ghost_solidness: number;
}

function TasksContent() {
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const searchParams = useSearchParams();
  const repoId = searchParams.get('repoId');

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
      const response = await fetch(`/api/get-roadmap?repoId=${repoId}&userId=demo-user`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch roadmap');
      }

      setRoadmap(data.roadmap);
      setProgress(data.progress);
      
      // Auto-select first incomplete task or first task
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 'demo-user',
          repoId,
          taskId,
          completed,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update task');
      }

      // Update local progress state
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

      // Show celebration if milestone reached
      if (data.celebrationTriggered) {
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 3000);
      }

      // Auto-select next incomplete task if marking as complete
      if (completed && roadmap) {
        const allTasks = roadmap.sections.flatMap(s => s.tasks);
        const currentIndex = allTasks.findIndex(t => t.id === taskId);
        const nextTask = allTasks.slice(currentIndex + 1).find(t => !progress?.completed_tasks.includes(t.id));
        if (nextTask) {
          setTimeout(() => setSelectedTaskId(nextTask.id), 300);
        }
      }
    } catch (err) {
      console.error('Failed to update task:', err);
    }
  };

  const normalizeDifficulty = (difficulty: string): 'easy' | 'medium' | 'hard' => {
    if (difficulty === 'beginner') return 'easy';
    if (difficulty === 'intermediate') return 'medium';
    if (difficulty === 'advanced') return 'hard';
    return difficulty as 'easy' | 'medium' | 'hard';
  };

  const getDifficultyColor = (difficulty: string) => {
    const normalized = normalizeDifficulty(difficulty);
    switch (normalized) {
      case 'easy': return 'bg-green-900/30 text-green-400 border-green-500/30';
      case 'medium': return 'bg-yellow-900/30 text-yellow-400 border-yellow-500/30';
      case 'hard': return 'bg-red-900/30 text-red-400 border-red-500/30';
      default: return 'bg-gray-800/30 text-gray-400 border-gray-500/30';
    }
  };

  // Get selected task details
  const selectedTask = roadmap?.sections
    .flatMap(s => s.tasks)
    .find(t => t.id === selectedTaskId);

  const isTaskCompleted = (taskId: string) => progress?.completed_tasks.includes(taskId) || false;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-400 text-lg">Summoning your roadmap...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">👻</div>
          <p className="text-red-400 mb-6 text-lg">{error}</p>
          <Link href="/dashboard">
            <button className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-lg font-semibold transition-all">
              Back to Dashboard
            </button>
          </Link>
        </div>
      </div>
    );
  }

  if (!roadmap) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <p className="text-gray-400 text-lg">No roadmap found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-gray-100 pb-24">
      {/* Header */}
      <div className="bg-[#12121a] border-b border-gray-800/50 sticky top-0 z-10 backdrop-blur-sm bg-opacity-95">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center mb-4">
            <Link 
              href="/dashboard" 
              className="text-pink-400 hover:text-pink-300 text-sm flex items-center gap-2 transition-colors group"
            >
              <span className="transform group-hover:-translate-x-1 transition-transform">←</span>
              <span>Dashboard</span>
            </Link>
            <Link 
              href="/profile" 
              className="text-gray-400 hover:text-pink-400 transition-colors"
            >
              <span className="text-3xl">👤</span>
            </Link>
          </div>

          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">👻</span>
                <h1 className="text-3xl font-bold text-white">{roadmap.repository_name}</h1>
              </div>
              <p className="text-gray-400 text-sm">
                {roadmap.total_tasks} tasks • {roadmap.estimated_completion_time}
              </p>
            </div>

          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex justify-between text-sm text-gray-400 mb-2">
              <span>Progress</span>
              <span className="text-pink-400 font-semibold">
                {progress?.overall_progress_percentage || 0}% Complete
              </span>
            </div>
            <div className="w-full bg-gray-800/50 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-pink-600 to-pink-500 h-2.5 rounded-full transition-all duration-500 ease-out shadow-lg shadow-pink-500/50"
                style={{ width: `${progress?.overall_progress_percentage || 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Two-Pane Layout */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left Pane - Task Checklist */}
          <div className="lg:col-span-2">
            <div className="bg-[#12121a] border border-gray-800/50 rounded-lg p-5 sticky top-[220px] max-h-[calc(100vh-260px)] overflow-y-auto custom-scrollbar">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span className="text-pink-400">📋</span>
                Tasks Checklist
              </h2>
              <div className="space-y-1">
                {roadmap.sections.map((section) => (
                  <div key={section.id} className="mb-6">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">
                      {section.title}
                    </h3>
                    <div className="space-y-1">
                      {section.tasks.map((task) => {
                        const isCompleted = isTaskCompleted(task.id);
                        const isSelected = selectedTaskId === task.id;

                        return (
                          <button
                            key={task.id}
                            onClick={() => setSelectedTaskId(task.id)}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all group ${
                              isSelected
                                ? 'bg-pink-600/10 border-2 border-pink-500/50 shadow-lg shadow-pink-500/10'
                                : 'hover:bg-gray-800/50 border-2 border-transparent hover:border-gray-700/50'
                            }`}
                          >
                            {/* Custom Checkbox */}
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTaskToggle(task.id, !isCompleted);
                              }}
                              className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer transition-all ${
                                isCompleted
                                  ? 'bg-pink-600 border-pink-500'
                                  : 'border-gray-600 hover:border-pink-500'
                              }`}
                            >
                              {isCompleted && (
                                <svg
                                  className="w-3 h-3 text-white"
                                  fill="none"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <p
                                className={`text-sm font-medium mb-1 ${
                                  isCompleted
                                    ? 'line-through text-gray-500'
                                    : 'text-gray-200 group-hover:text-white'
                                }`}
                              >
                                {task.title}
                              </p>
                              <div className="flex items-center gap-2">
                                <span
                                  className={`px-2 py-0.5 text-xs font-medium rounded border ${getDifficultyColor(
                                    task.difficulty
                                  )}`}
                                >
                                  {normalizeDifficulty(task.difficulty)}
                                </span>
                                {task.estimated_time && (
                                  <span className="text-xs text-gray-500">
                                    {task.estimated_time}
                                  </span>
                                )}
                              </div>
                            </div>

                            {isSelected && (
                              <div className="flex-shrink-0">
                                <div className="w-1.5 h-8 bg-pink-500 rounded-full"></div>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Pane - Task Details */}
          <div className="lg:col-span-3">
            {selectedTask ? (
              <div className="bg-[#12121a] border border-gray-800/50 rounded-lg p-6">
                {/* Task Header */}
                <div className="mb-6 pb-6 border-b border-gray-800/50">
                  <div className="flex items-start justify-between mb-3">
                    <h2 className="text-2xl font-bold text-white pr-4">
                      {selectedTask.title}
                    </h2>
                    <span
                      className={`px-3 py-1.5 text-sm font-semibold rounded-lg border whitespace-nowrap ${getDifficultyColor(
                        selectedTask.difficulty
                      )}`}
                    >
                      {normalizeDifficulty(selectedTask.difficulty)}
                    </span>
                  </div>

                  {/* Task Description - Enhanced Format */}
                  {typeof selectedTask.description === 'string' ? (
                    <p className="text-gray-400 text-base leading-relaxed">
                      {selectedTask.description}
                    </p>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-gray-300 text-base leading-relaxed">
                        {selectedTask.description.summary}
                      </p>

                      {selectedTask.description.why_needed && (
                        <div className="bg-blue-900/20 border-l-4 border-blue-500 p-4 rounded-r-lg">
                          <p className="text-xs font-semibold text-blue-400 uppercase tracking-wide mb-1.5">
                            Why This Matters
                          </p>
                          <p className="text-sm text-blue-300 leading-relaxed">
                            {selectedTask.description.why_needed}
                          </p>
                        </div>
                      )}

                      {selectedTask.description.learning_goal && (
                        <div className="bg-green-900/20 border-l-4 border-green-500 p-4 rounded-r-lg">
                          <p className="text-xs font-semibold text-green-400 uppercase tracking-wide mb-1.5">
                            What You'll Learn
                          </p>
                          <p className="text-sm text-green-300 leading-relaxed">
                            {selectedTask.description.learning_goal}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Task Content */}
                <div className="space-y-6 max-h-[calc(100vh-450px)] overflow-y-auto pr-2 custom-scrollbar">
                  {/* Render Steps (New Format) */}
                  {selectedTask.steps && selectedTask.steps.length > 0 && (
                    <TaskSteps steps={selectedTask.steps} />
                  )}

                  {/* Fallback to Instructions (Old Format) */}
                  {!selectedTask.steps && selectedTask.instructions && (
                    <div>
                      <h3 className="font-semibold text-white mb-3 flex items-center gap-2 text-lg">
                        <span className="text-pink-400">📋</span>
                        Instructions
                      </h3>
                      {Array.isArray(selectedTask.instructions) ? (
                        <ol className="list-decimal list-inside space-y-3 text-gray-300">
                          {selectedTask.instructions.map((instruction, index) => (
                            <li key={index} className="pl-2 leading-relaxed">
                              {instruction}
                            </li>
                          ))}
                        </ol>
                      ) : (
                        <p className="text-gray-300 leading-relaxed">
                          {selectedTask.instructions}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Commands (New Format) */}
                  {selectedTask.commands && selectedTask.commands.length > 0 && (
                    <CommandBlocks commands={selectedTask.commands} />
                  )}

                  {/* Code Blocks (New Enhanced Format) */}
                  {selectedTask.code_blocks && selectedTask.code_blocks.length > 0 && (
                    <CodeBlocks codeBlocks={selectedTask.code_blocks} />
                  )}

                  {/* Code Snippets (Old Format - Fallback) */}
                  {!selectedTask.code_blocks &&
                    selectedTask.code_snippets &&
                    selectedTask.code_snippets.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-white mb-3 flex items-center gap-2 text-lg">
                          <span className="text-pink-400">💻</span>
                          Code
                        </h3>
                        <div className="space-y-3">
                          {selectedTask.code_snippets.map((snippet, index) => {
                            if (typeof snippet === 'string') {
                              return (
                                <div
                                  key={index}
                                  className="bg-[#0a0a0f] border border-gray-800 rounded-lg overflow-hidden"
                                >
                                  <pre className="p-4 text-sm font-mono overflow-x-auto custom-scrollbar">
                                    <code className="text-gray-300">{snippet}</code>
                                  </pre>
                                </div>
                              );
                            } else {
                              return (
                                <div
                                  key={index}
                                  className="bg-[#0a0a0f] border border-gray-800 rounded-lg overflow-hidden"
                                >
                                  {snippet.file && (
                                    <div className="bg-gray-900/50 px-4 py-2 text-xs text-gray-400 border-b border-gray-800 font-mono flex items-center gap-2">
                                      <span className="text-pink-400">📄</span>
                                      {snippet.file}
                                    </div>
                                  )}
                                  <pre className="p-4 text-sm font-mono overflow-x-auto custom-scrollbar">
                                    <code className="text-gray-300">
                                      {snippet.code || JSON.stringify(snippet)}
                                    </code>
                                  </pre>
                                </div>
                              );
                            }
                          })}
                        </div>
                      </div>
                    )}

                  {/* References (New Format) */}
                  {selectedTask.references && selectedTask.references.length > 0 && (
                    <ReferencesSection references={selectedTask.references} />
                  )}

                  {/* Tips */}
                  {selectedTask.tips && selectedTask.tips.length > 0 && (
                    <TipsSection tips={selectedTask.tips} />
                  )}

                  {/* Warnings */}
                  {selectedTask.warnings && selectedTask.warnings.length > 0 && (
                    <WarningsSection warnings={selectedTask.warnings} />
                  )}

                  {/* Verification (New Format) - Commented out until data is populated */}
                  {/* {selectedTask.verification && (
                    <VerificationSection verification={selectedTask.verification} />
                  )} */}
                </div>

                {/* Mark Complete Button */}
                <div className="mt-8 pt-6 border-t border-gray-800/50 flex justify-end">
                  <button
                    onClick={() =>
                      handleTaskToggle(
                        selectedTask.id,
                        !isTaskCompleted(selectedTask.id)
                      )
                    }
                    className={`px-8 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 text-base ${
                      isTaskCompleted(selectedTask.id)
                        ? 'bg-gray-800/50 text-gray-500 cursor-not-allowed border border-gray-700'
                        : 'bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-700 hover:to-pink-600 text-white shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50'
                    }`}
                    disabled={isTaskCompleted(selectedTask.id)}
                  >
                    {isTaskCompleted(selectedTask.id) ? (
                      <>
                        <span>✓</span>
                        Completed
                      </>
                    ) : (
                      <>
                        Mark as Complete
                        <span className="transform group-hover:translate-x-1 transition-transform">
                          →
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-[#12121a] border border-gray-800/50 rounded-lg p-12 text-center">
                <div className="text-6xl mb-4">👻</div>
                <p className="text-gray-400 text-lg">
                  Select a task from the checklist to begin
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Ghost Mentor Chat - Floating Button */}
      {repoId && !chatOpen && (
        <div className="fixed bottom-8 right-8 z-40">
          <button
            onClick={() => setChatOpen(true)}
            className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-700 hover:to-pink-600 text-white rounded-full shadow-2xl shadow-pink-500/50 hover:shadow-pink-500/70 transition-all hover:scale-105 group"
          >
            <span className="text-2xl animate-bounce">👻</span>
            <span className="font-semibold text-base">Ask Ghost Mentor</span>
          </button>
        </div>
      )}

      {/* Ghost Mentor Chat Component */}
      {repoId && chatOpen && (
        <div className="fixed bottom-0 right-0 w-full md:w-[550px] h-[650px] z-50 shadow-2xl">
          <div className="relative h-full">
            <button
              onClick={() => setChatOpen(false)}
              className="absolute -top-12 right-4 bg-[#12121a] hover:bg-gray-800 text-gray-400 hover:text-white rounded-full p-3 shadow-xl border border-gray-800 transition-all"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <GhostMentorChat repoId={repoId} userId="demo-user" />
          </div>
        </div>
      )}

      {/* Custom Scrollbar Styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(236, 72, 153, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(236, 72, 153, 0.5);
        }
      `}</style>
    </div>
  );
}

export default function Tasks() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mb-4"></div>
          <p className="text-gray-400">Loading tasks...</p>
        </div>
      </div>
    }>
      <TasksContent />
    </Suspense>
  );
}