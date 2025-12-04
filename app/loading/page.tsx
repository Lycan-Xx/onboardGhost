'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

interface AnalysisLog {
  timestamp: Date;
  step: number;
  message: string;
  details?: any;
}

interface AnalysisProgress {
  current_step: number;
  step_name: string;
  step_status: 'pending' | 'in-progress' | 'completed' | 'failed';
  logs: AnalysisLog[];
  updated_at: Date;
}

function LoadingContent() {
  const [progress, setProgress] = useState<AnalysisProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const repoId = searchParams.get('repoId');

  useEffect(() => {
    if (!repoId) {
      router.push('/dashboard');
      return;
    }

    // Check if roadmap already exists (cached analysis)
    const checkExistingRoadmap = async () => {
      try {
        const response = await fetch(`/api/get-roadmap?repoId=${repoId}&userId=demo-user`);
        if (response.ok) {
          const data = await response.json();
          if (data.roadmap && data.roadmap.sections) {
            console.log('[Loading] Roadmap already exists, redirecting to tasks...');
            router.push(`/tasks?repoId=${repoId}`);
            return true;
          }
        }
      } catch (error) {
        console.log('[Loading] No existing roadmap, waiting for analysis...');
      }
      return false;
    };

    // Check immediately for cached results
    checkExistingRoadmap().then((exists) => {
      if (exists) return; // Already redirected

      // Listen to real-time progress updates
      const progressRef = doc(db, 'analysis_progress', repoId);
      const unsubscribe = onSnapshot(
        progressRef,
        (doc) => {
          if (doc.exists()) {
            const data = doc.data() as AnalysisProgress;
            setProgress(data);

            // Check if analysis is complete
            if (data.step_status === 'completed' && data.current_step === 8) {
              setTimeout(() => {
                router.push(`/tasks?repoId=${repoId}`);
              }, 2000);
            } else if (data.step_status === 'failed') {
              setError('Analysis failed. Please try again.');
            }
          } else {
            // No progress document - might be cached, check again
            setTimeout(() => checkExistingRoadmap(), 3000);
          }
        },
        (error) => {
          console.error('Error listening to progress:', error);
          // Try checking for existing roadmap as fallback
          checkExistingRoadmap();
        }
      );

      return () => unsubscribe();
    });
  }, [repoId, router]);

  const getProgressPercentage = () => {
    if (!progress) return 0;
    return Math.round((progress.current_step / 8) * 100);
  };

  const stepNames = [
    'Repository Access',
    'File Tree Filtering',
    'Static Analysis',
    'Project Purpose',
    'Security Scan',
    'File Upload',
    'Roadmap Generation',
    'Complete'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Title */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">
              Analyzing Repository
            </h1>
            <p className="text-xl text-gray-300">
              Please wait while we analyze your repository...
            </p>
          </div>

          {error ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg text-center">
              <p className="font-semibold">Analysis Failed</p>
              <p>{error}</p>
              <button
                onClick={() => router.push('/dashboard')}
                className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
              >
                Try Again
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-xl p-8">
              {/* Progress Bar */}
              <div className="mb-8">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Progress</span>
                  <span>{getProgressPercentage()}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-purple-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${getProgressPercentage()}%` }}
                  />
                </div>
              </div>

              {/* Current Step */}
              {progress && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    Step {progress.current_step}: {progress.step_name}
                  </h3>
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${
                      progress.step_status === 'completed' ? 'bg-green-500' :
                      progress.step_status === 'in-progress' ? 'bg-yellow-500 animate-pulse' :
                      progress.step_status === 'failed' ? 'bg-red-500' :
                      'bg-gray-300'
                    }`} />
                    <span className="text-gray-600 capitalize">
                      {progress.step_status.replace('-', ' ')}
                    </span>
                  </div>
                </div>
              )}

              {/* Step List */}
              <div className="space-y-3">
                {stepNames.map((stepName, index) => {
                  const stepNumber = index + 1;
                  const isCompleted = progress && progress.current_step > stepNumber;
                  const isCurrent = progress && progress.current_step === stepNumber;

                  return (
                    <div
                      key={stepNumber}
                      className={`flex items-center space-x-3 p-3 rounded ${
                        isCompleted ? 'bg-green-50' :
                        isCurrent ? 'bg-yellow-50' :
                        'bg-gray-50'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-semibold ${
                        isCompleted ? 'bg-green-500 text-white' :
                        isCurrent ? 'bg-yellow-500 text-white' :
                        'bg-gray-300 text-gray-600'
                      }`}>
                        {isCompleted ? '✓' : stepNumber}
                      </div>
                      <span className={`${
                        isCompleted ? 'text-green-800' :
                        isCurrent ? 'text-yellow-800' :
                        'text-gray-600'
                      }`}>
                        {stepName}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Analysis Logs */}
              {progress && progress.logs && progress.logs.length > 0 && (
                <div className="mt-8">
                  <h4 className="text-md font-semibold text-gray-800 mb-4">Analysis Log</h4>
                  <div className="bg-gray-100 rounded p-4 max-h-40 overflow-y-auto">
                    {progress.logs.slice(-5).map((log, index) => (
                      <div key={index} className="text-sm text-gray-700 mb-1">
                        <span className="text-gray-500">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                        {' - '}
                        {log.message}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Loading analysis...</p>
        </div>
      </div>
    }>
      <LoadingContent />
    </Suspense>
  );
}
