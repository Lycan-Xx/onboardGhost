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

  const isTaskCompleted = (taskId: string) => progress?.completed_tasks.includes(taskId) || false;

  // Get selected task details
  const selectedTask = roadmap?.sections
    .flatMap(s => s.tasks)
    .find(t => t.id === selectedTaskId);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading tasks...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-6">{error}</p>
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
        <p className="text-gray-400">No roadmap found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col p-4 sm:p-6 lg:p-8 pb-32">
      {/* Header */}
      <header className="w-full max-w-7xl mx-auto mb-8">
        {/* Top Navigation */}
        <div className="flex justify-between items-center mb-6">
          <Link 
            href="/dashboard" 
            className="flex items-center gap-2 text-gray-400 hover:text-pink-400 transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
            <span>Return to Dashboard</span>
          </Link>
          <Link 
            href="/profile" 
            className="flex items-center gap-2 text-gray-400 hover:text-pink-400 transition-colors"
          >
            <span className="material-symbols-outlined">account_circle</span>
            <span>Profile</span>
          </Link>
        </div>

        {/* Title */}
        <div className="text-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            {roadmap.repository_name}
          </h1>
          <p className="text-gray-400 text-sm">Onboarding Checklist</p>
        </div>

        {/* Progress Bar */}
        <div className="w-full max-w-2xl mx-auto">
          <div className="flex items-center gap-4 w-full">
            <span className="text-sm font-medium text-pink-400">
              {progress?.overall_progress_percentage || 0}%
            </span>
            <div className="w-full bg-gray-800/50 rounded-full h-1.5">
              <div
                className="bg-pink-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${progress?.overall_progress_percentage || 0}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Two Column Layout */}
      <main className="flex-grow w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        {/* Left Panel - Task Checklist (2/5) */}
        <div className="lg:col-span-2 bg-[#1e293b] border border-gray-700/80 rounded-lg p-6 space-y-3">
          {roadmap.sections.map((section) => (
            <div key={section.id}>
              {section.tasks.map((task) => {
                const isCompleted = isTaskCompleted(task.id);
                const isSelected = selectedTaskId === task.id;

                return (
                  <label
                    key={task.id}
                    className={`flex items-center gap-3 text-lg p-3 rounded-md transition-colors cursor-pointer ${
                      isCompleted
                        ? 'text-gray-500 bg-gray-700/50'
                        : isSelected
                        ? 'text-white bg-pink-500/10 ring-1 ring-pink-500/50'
                        : 'text-gray-400 hover:bg-gray-700/30'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isCompleted}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleTaskToggle(task.id, e.target.checked);
                      }}
                      className="h-5 w-5 rounded-sm border-2 border-gray-600 bg-transparent focus:ring-pink-500 focus:ring-offset-[#1e293b] text-pink-500"
                    />
                    <span 
                      className="material-symbols-outlined !text-2xl"
                      style={{ color: isCompleted ? '#ec4899' : 'currentColor' }}
                    >
                      {isCompleted ? 'check_circle' : 'radio_button_unchecked'}
                    </span>
                    <span 
                      className="flex-grow"
                      onClick={() => setSelectedTaskId(task.id)}
                    >
                      {task.title}
                    </span>
                  </label>
                );
              })}
            </div>
          ))}
        </div>

        {/* Right Panel - Task Details (3/5) */}
        <div className="lg:col-span-3 bg-[#1e293b] border border-gray-700/80 rounded-lg p-6 flex flex-col min-h-[500px]">
          {selectedTask ? (
            <>
              {/* Task Content */}
              <div className="flex-grow space-y-4 text-gray-400 text-base overflow-y-auto">
                <h2 className="text-xl font-bold text-white mb-4">
                  {selectedTask.title}
                </h2>

                {/* Description */}
                {typeof selectedTask.description === 'string' ? (
                  <p className="leading-relaxed">{selectedTask.description}</p>
                ) : (
                  <div className="space-y-3">
                    <p className="leading-relaxed text-gray-300">
                      {selectedTask.description.summary}
                    </p>
                    {selectedTask.description.why_needed && (
                      <p className="text-sm text-gray-400 italic">
                        {selectedTask.description.why_needed}
                      </p>
                    )}
                  </div>
                )}

                {/* Steps */}
                {selectedTask.steps && selectedTask.steps.length > 0 && (
                  <TaskSteps steps={selectedTask.steps} />
                )}

                {/* Commands */}
                {selectedTask.commands && selectedTask.commands.length > 0 && (
                  <CommandBlocks commands={selectedTask.commands} />
                )}

                {/* Code Blocks */}
                {selectedTask.code_blocks && selectedTask.code_blocks.length > 0 && (
                  <CodeBlocks codeBlocks={selectedTask.code_blocks} />
                )}

                {/* Tips */}
                {selectedTask.tips && selectedTask.tips.length > 0 && (
                  <TipsSection tips={selectedTask.tips} />
                )}

                {/* Warnings */}
                {selectedTask.warnings && selectedTask.warnings.length > 0 && (
                  <WarningsSection warnings={selectedTask.warnings} />
                )}

                {/* References */}
                {selectedTask.references && selectedTask.references.length > 0 && (
                  <ReferencesSection references={selectedTask.references} />
                )}
              </div>

              {/* Mark Complete Button */}
              <div className="flex justify-end mt-6">
                <button
                  onClick={() =>
                    handleTaskToggle(
                      selectedTask.id,
                      !isTaskCompleted(selectedTask.id)
                    )
                  }
                  disabled={isTaskCompleted(selectedTask.id)}
                  className={`px-6 py-2 font-bold rounded-md transition-all duration-300 flex items-center gap-2 ${
                    isTaskCompleted(selectedTask.id)
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      : 'bg-pink-500 text-[#0a0a0f] hover:bg-pink-600 shadow-lg hover:shadow-xl'
                  }`}
                >
                  {isTaskCompleted(selectedTask.id) ? (
                    'Completed'
                  ) : (
                    <>
                      Mark as Complete
                      <span className="material-symbols-outlined">arrow_forward</span>
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">Select a task to view details</p>
            </div>
          )}
        </div>
      </main>

      {/* Ghost Mentor Chat */}
      {repoId && <GhostMentorChat repoId={repoId} userId="demo-user" />}
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
