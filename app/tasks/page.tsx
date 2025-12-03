'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import GhostVisualization from '@/components/GhostVisualization';
import GhostMentorChat from '@/components/GhostMentorChat';
import Link from 'next/link';

interface Task {
  id: string;
  title: string;
  description: string;
  instructions: string | string[];
  code_snippets?: string[];
  tips?: string[];
  warnings?: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  estimated_time: string;
  dependencies?: string[];
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
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [showCelebration, setShowCelebration] = useState(false);
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const toggleTaskExpansion = (taskId: string) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
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
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="container mx-auto px-4 py-8">
        {/* Header with Ghost */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <Link href="/dashboard" className="text-purple-600 hover:text-purple-700 text-sm mb-2 inline-block">
                ← Back to Dashboard
              </Link>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {roadmap.repository_name}
              </h1>
              <p className="text-gray-600">
                {roadmap.total_tasks} tasks • {roadmap.estimated_completion_time}
              </p>
            </div>

            {/* Ghost Visualization */}
            <div className="flex-shrink-0 ml-8">
              <GhostVisualization
                progress={progress?.overall_progress_percentage || 0}
                showCelebration={showCelebration}
              />
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Overall Progress</span>
              <span>{progress?.overall_progress_percentage || 0}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-purple-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${progress?.overall_progress_percentage || 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-8">
          {roadmap.sections.map((section) => (
            <div key={section.id} className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {section.title}
              </h2>
              <p className="text-gray-600 mb-6">{section.description}</p>

              {/* Tasks */}
              <div className="space-y-4">
                {section.tasks.map((task) => {
                  const isCompleted = progress?.completed_tasks.includes(task.id) || false;
                  const isExpanded = expandedTasks.has(task.id);

                  return (
                    <div
                      key={task.id}
                      className={`border rounded-lg p-4 transition-all duration-200 ${
                        isCompleted ? 'bg-green-50 border-green-200' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          checked={isCompleted}
                          onChange={(e) => handleTaskToggle(task.id, e.target.checked)}
                          className="mt-1 h-5 w-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded cursor-pointer"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3
                              className={`font-medium cursor-pointer hover:text-purple-600 transition-colors ${
                                isCompleted ? 'text-green-800 line-through' : 'text-gray-900'
                              }`}
                              onClick={() => toggleTaskExpansion(task.id)}
                            >
                              {task.title}
                            </h3>
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(task.difficulty)}`}>
                                {task.difficulty}
                              </span>
                              <span className="text-sm text-gray-500">
                                {task.estimated_time}
                              </span>
                              <button
                                onClick={() => toggleTaskExpansion(task.id)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                              >
                                {isExpanded ? '▼' : '▶'}
                              </button>
                            </div>
                          </div>
                          <p className="text-gray-600 text-sm mt-1">{task.description}</p>

                          {/* Expanded Content */}
                          {isExpanded && (
                            <div className="mt-4 space-y-4 border-t pt-4">
                              {/* Instructions */}
                              <div>
                                <h4 className="font-medium text-gray-900 mb-2">📋 Instructions:</h4>
                                {Array.isArray(task.instructions) ? (
                                  <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
                                    {task.instructions.map((instruction, index) => (
                                      <li key={index}>{instruction}</li>
                                    ))}
                                  </ol>
                                ) : (
                                  <p className="text-sm text-gray-700">{task.instructions}</p>
                                )}
                              </div>

                              {/* Code Snippets */}
                              {task.code_snippets && task.code_snippets.length > 0 && (
                                <div>
                                  <h4 className="font-medium text-gray-900 mb-2">💻 Code Examples:</h4>
                                  {task.code_snippets.map((snippet, index) => (
                                    <pre key={index} className="bg-gray-100 p-3 rounded text-sm overflow-x-auto border">
                                      <code>{snippet}</code>
                                    </pre>
                                  ))}
                                </div>
                              )}

                              {/* Tips */}
                              {task.tips && task.tips.length > 0 && (
                                <div>
                                  <h4 className="font-medium text-gray-900 mb-2">💡 Tips:</h4>
                                  <ul className="list-disc list-inside space-y-1 text-sm text-blue-700 bg-blue-50 p-3 rounded">
                                    {task.tips.map((tip, index) => (
                                      <li key={index}>{tip}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Warnings */}
                              {task.warnings && task.warnings.length > 0 && (
                                <div>
                                  <h4 className="font-medium text-gray-900 mb-2">⚠️ Warnings:</h4>
                                  <ul className="list-disc list-inside space-y-1 text-sm text-red-700 bg-red-50 p-3 rounded">
                                    {task.warnings.map((warning, index) => (
                                      <li key={index}>{warning}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ghost Mentor Chat */}
      {repoId && <GhostMentorChat repoId={repoId} userId="demo-user" />}
    </div>
  );
}
