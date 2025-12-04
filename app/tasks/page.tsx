'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import GhostVisualization from '@/components/GhostVisualization';
import GhostMentorChat from '@/components/GhostMentorChat';
import Link from 'next/link';

interface TaskDescription {
  summary: string;
  why_needed: string;
  learning_goal: string;
}

interface TaskCommand {
  command: string;
  description: string;
  expected_output: string;
  os: string;
}

interface TaskStep {
  order: number;
  action: string;
  details: string;
  os_specific?: Record<string, string>;
}

interface TaskVerification {
  how_to_verify: string;
  expected_result: string;
  troubleshooting: string[];
}

interface Task {
  id: string;
  title: string;
  description: string | TaskDescription;
  instructions?: string | string[];
  steps?: TaskStep[];
  commands?: TaskCommand[];
  code_snippets?: (string | { file?: string; language?: string; code: string })[];
  tips?: string[];
  warnings?: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  estimated_time: string;
  dependencies?: string[];
  verification?: TaskVerification;
  depends_on?: string[];
  references?: string[];
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

export default function Tasks() {
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

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get selected task details
  const selectedTask = roadmap?.sections
    .flatMap(s => s.tasks)
    .find(t => t.id === selectedTaskId);

  const isTaskCompleted = (taskId: string) => progress?.completed_tasks.includes(taskId) || false;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading roadmap...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!roadmap) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">No roadmap found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center mb-4">
            <Link href="/dashboard" className="text-purple-600 hover:text-purple-700 text-sm flex items-center gap-1">
              ← Back to Dashboard
            </Link>
            <Link href="/profile" className="text-gray-600 hover:text-gray-700">
              <span className="text-2xl">👤</span>
            </Link>
          </div>

          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{roadmap.repository_name}</h1>
              <p className="text-gray-600 text-sm">
                {roadmap.total_tasks} tasks • {roadmap.estimated_completion_time}
              </p>
            </div>

            {/* Ghost Visualization */}
            <div className="flex-shrink-0">
              <GhostVisualization
                progress={progress?.overall_progress_percentage || 0}
                showCelebration={showCelebration}
              />
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Overall Progress</span>
              <span>{progress?.overall_progress_percentage || 0}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress?.overall_progress_percentage || 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Two-Pane Layout */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left Pane - Task Checklist */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-4 sticky top-[200px]">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Tasks Checklist</h2>
              <div className="space-y-1 max-h-[calc(100vh-350px)] overflow-y-auto">
                {roadmap.sections.map((section) => (
                  <div key={section.id} className="mb-4">
                    <h3 className="text-sm font-medium text-gray-500 mb-2 px-2">{section.title}</h3>
                    {section.tasks.map((task) => {
                      const isCompleted = isTaskCompleted(task.id);
                      const isSelected = selectedTaskId === task.id;

                      return (
                        <button
                          key={task.id}
                          onClick={() => setSelectedTaskId(task.id)}
                          className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all ${
                            isSelected
                              ? 'bg-purple-50 border-2 border-purple-600'
                              : 'hover:bg-gray-50 border-2 border-transparent'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isCompleted}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleTaskToggle(task.id, e.target.checked);
                            }}
                            className="h-5 w-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded cursor-pointer"
                          />
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${isCompleted ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                              {task.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getDifficultyColor(task.difficulty)}`}>
                                {task.difficulty}
                              </span>
                              {task.estimated_time && (
                                <span className="text-xs text-gray-500">{task.estimated_time}</span>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Pane - Task Details */}
          <div className="lg:col-span-3">
            {selectedTask ? (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="mb-6">
                  <div className="flex items-start justify-between mb-2">
                    <h2 className="text-2xl font-bold text-gray-900">{selectedTask.title}</h2>
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${getDifficultyColor(selectedTask.difficulty)}`}>
                      {selectedTask.difficulty}
                    </span>
                  </div>
                  
                  {/* Handle both old string format and new object format */}
                  {typeof selectedTask.description === 'string' ? (
                    <p className="text-gray-600">{selectedTask.description}</p>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-gray-700 text-lg">{selectedTask.description.summary}</p>
                      {selectedTask.description.why_needed && (
                        <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
                          <p className="text-sm font-semibold text-blue-900 mb-1">Why this matters:</p>
                          <p className="text-sm text-blue-800">{selectedTask.description.why_needed}</p>
                        </div>
                      )}
                      {selectedTask.description.learning_goal && (
                        <div className="bg-green-50 border-l-4 border-green-500 p-3 rounded">
                          <p className="text-sm font-semibold text-green-900 mb-1">What you'll learn:</p>
                          <p className="text-sm text-green-800">{selectedTask.description.learning_goal}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-6 max-h-[calc(100vh-400px)] overflow-y-auto pr-2">
                  {/* Steps */}
                  {selectedTask.steps && selectedTask.steps.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        📋 Steps to Follow
                      </h3>
                      <ol className="space-y-3">
                        {selectedTask.steps.map((step, index) => (
                          <li key={index} className="flex gap-3">
                            <span className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white text-sm font-semibold rounded-full flex items-center justify-center">
                              {step.order}
                            </span>
                            <div className="flex-1">
                              <p className="text-gray-700 font-medium">{step.action}</p>
                              <p className="text-gray-600 text-sm mt-1">{step.details}</p>
                              {step.os_specific && Object.keys(step.os_specific).length > 0 && (
                                <div className="mt-2 space-y-1">
                                  {Object.entries(step.os_specific).map(([os, instruction]) => (
                                    <div key={os} className="text-xs bg-gray-100 p-2 rounded">
                                      <span className="font-medium text-gray-700">{os}:</span> {instruction}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {/* Instructions (fallback for old format) */}
                  {!selectedTask.steps && selectedTask.instructions && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        📋 Instructions
                      </h3>
                      {Array.isArray(selectedTask.instructions) ? (
                        <ol className="list-decimal list-inside space-y-2 text-gray-700">
                          {selectedTask.instructions.map((instruction, index) => (
                            <li key={index} className="pl-2">{instruction}</li>
                          ))}
                        </ol>
                      ) : (
                        <p className="text-gray-700">{selectedTask.instructions}</p>
                      )}
                    </div>
                  )}

                  {/* Commands */}
                  {selectedTask.commands && selectedTask.commands.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        ⚡ Commands to Run
                      </h3>
                      <div className="space-y-4">
                        {selectedTask.commands.map((commandObj, index) => (
                          <div key={index} className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                            <div className="flex items-start gap-2 mb-2">
                              <span className="text-green-400 select-none">$</span>
                              <code className="flex-1 text-sm font-mono">{commandObj.command}</code>
                            </div>
                            {commandObj.description && (
                              <div className="text-xs text-gray-400 mb-2">
                                {commandObj.description}
                              </div>
                            )}
                            {commandObj.expected_output && (
                              <div className="text-xs text-blue-300">
                                Expected: {commandObj.expected_output}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Code Snippets */}
                  {selectedTask.code_snippets && selectedTask.code_snippets.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        💻 Code to Write
                      </h3>
                      <div className="space-y-3">
                        {selectedTask.code_snippets.map((snippet, index) => {
                          // Handle both string and object formats
                          if (typeof snippet === 'string') {
                            return (
                              <div key={index} className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                                <pre className="text-sm font-mono">
                                  <code>{snippet}</code>
                                </pre>
                              </div>
                            );
                          } else if (snippet && typeof snippet === 'object') {
                            // Handle object format: {file, language, code}
                            return (
                              <div key={index} className="bg-gray-900 text-gray-100 rounded-lg overflow-hidden">
                                {snippet.file && (
                                  <div className="bg-gray-800 px-4 py-2 text-xs text-gray-400 border-b border-gray-700">
                                    📄 {snippet.file}
                                  </div>
                                )}
                                <pre className="p-4 text-sm font-mono overflow-x-auto">
                                  <code>{snippet.code || JSON.stringify(snippet)}</code>
                                </pre>
                              </div>
                            );
                          }
                          return null;
                        })}
                      </div>
                    </div>
                  )}

                  {/* Tips */}
                  {selectedTask.tips && selectedTask.tips.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        💡 Tips
                      </h3>
                      <ul className="list-disc list-inside space-y-2 text-blue-700 bg-blue-50 p-4 rounded-lg">
                        {selectedTask.tips.map((tip, index) => (
                          <li key={index} className="pl-2">{tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Warnings */}
                  {selectedTask.warnings && selectedTask.warnings.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        ⚠️ Warnings
                      </h3>
                      <ul className="list-disc list-inside space-y-2 text-red-700 bg-red-50 p-4 rounded-lg">
                        {selectedTask.warnings.map((warning, index) => (
                          <li key={index} className="pl-2">{warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Mark Complete Button */}
                <div className="mt-6 pt-6 border-t flex justify-end">
                  <button
                    onClick={() => handleTaskToggle(selectedTask.id, !isTaskCompleted(selectedTask.id))}
                    className={`px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                      isTaskCompleted(selectedTask.id)
                        ? 'bg-gray-200 text-gray-600 cursor-default'
                        : 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg hover:shadow-xl'
                    }`}
                  >
                    {isTaskCompleted(selectedTask.id) ? (
                      <>
                        <span>✓</span>
                        Completed
                      </>
                    ) : (
                      <>
                        Mark as Complete
                        <span>→</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-6 text-center text-gray-500">
                Select a task from the checklist to view details
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Ghost Mentor Chat - Fixed at bottom */}
      {repoId && !chatOpen && (
        <div className="fixed bottom-6 right-6 z-40">
          <button
            onClick={() => setChatOpen(true)}
            className="flex items-center gap-2 px-5 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all"
          >
            <span className="text-xl">👻</span>
            <span className="font-semibold">Ask Ghost Mentor</span>
          </button>
        </div>
      )}

      {/* Ghost Mentor Chat Component */}
      {repoId && chatOpen && (
        <div className="fixed bottom-0 right-0 w-full md:w-[500px] h-[600px] z-50">
          <div className="relative h-full">
            <button
              onClick={() => setChatOpen(false)}
              className="absolute -top-10 right-4 bg-white hover:bg-gray-100 text-gray-600 rounded-full p-2 shadow-lg transition-colors"
            >
              <span className="text-xl">✕</span>
            </button>
            <GhostMentorChat repoId={repoId} userId="demo-user" />
          </div>
        </div>
      )}
    </div>
  );
}
