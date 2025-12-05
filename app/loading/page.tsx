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

interface Step {
  name: string;
  status: 'completed' | 'in-progress' | 'pending';
}

function LoadingContent() {
  const [progress, setProgress] = useState<AnalysisProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [repoName, setRepoName] = useState<string>('repository');
  const [steps, setSteps] = useState<Step[]>([
    { name: 'Cloning repository', status: 'pending' },
    { name: 'Parsing file structure', status: 'pending' },
    { name: 'Analyzing dependencies', status: 'pending' },
    { name: 'Scanning security', status: 'pending' },
    { name: 'Generating roadmap', status: 'pending' },
  ]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const repoId = searchParams.get('repoId');

  // Extract repo name from repoId
  useEffect(() => {
    if (repoId) {
      const parts = repoId.split('_');
      if (parts.length >= 2) {
        setRepoName(parts.slice(1).join('/'));
      }
    }
  }, [repoId]);

  // Update steps based on progress
  useEffect(() => {
    if (!progress) return;

    const stepMapping: { [key: number]: number } = {
      1: 0, // Repository Access -> Cloning
      2: 1, // File Tree -> Parsing
      3: 2, // Static Analysis -> Analyzing dependencies
      4: 2, // Project Purpose -> Analyzing dependencies
      5: 3, // Security Scan -> Scanning security
      6: 4, // File Upload -> Generating roadmap
      7: 4, // Roadmap Generation -> Generating roadmap
      8: 4, // Complete -> Generating roadmap
    };

    const currentStepIndex = stepMapping[progress.current_step] || 0;

    setSteps(prevSteps => prevSteps.map((step, index) => {
      if (index < currentStepIndex) {
        return { ...step, status: 'completed' };
      } else if (index === currentStepIndex) {
        return { ...step, status: progress.step_status === 'completed' ? 'completed' : 'in-progress' };
      }
      return { ...step, status: 'pending' };
    }));
  }, [progress]);

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

  const handleCancel = () => {
    if (confirm('Are you sure you want to cancel this analysis?')) {
      router.push('/dashboard');
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-[#0a0a0f] p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-2xl flex flex-col items-center gap-8">
        
        {/* Ghost Animation/Icon */}
        <div className="w-full max-w-xs">
          <div className="flex items-center justify-center">
            <div className="relative">
              <span className="material-symbols-outlined text-pink-500 animate-pulse" style={{ fontSize: '120px' }}>
                psychology
              </span>
              <div className="absolute inset-0 bg-pink-500/20 blur-3xl rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Headline */}
        <h1 className="text-white text-2xl sm:text-3xl font-bold leading-tight text-center">
          Analyzing {repoName}...
        </h1>

        {error ? (
          <div className="w-full bg-red-900/20 border border-red-500/50 rounded-lg p-6 text-center">
            <p className="text-red-300 font-semibold mb-2">Analysis Failed</p>
            <p className="text-red-400 text-sm mb-4">{error}</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        ) : (
          <>
            {/* Progress Bar */}
            <div className="flex w-full flex-col gap-3">
              <div className="flex gap-6 justify-between">
                <p className="text-gray-300 text-base font-medium">Overall Progress</p>
                <p className="text-white text-sm font-normal">{getProgressPercentage()}%</p>
              </div>
              <div className="rounded-full bg-gray-800/50">
                <div 
                  className="h-2 rounded-full bg-pink-500 transition-all duration-500 ease-out"
                  style={{ width: `${getProgressPercentage()}%` }}
                />
              </div>
            </div>

            {/* Steps List */}
            <div className="flex w-full flex-col gap-2">
              <h4 className="text-gray-400 text-sm font-bold px-4 py-2 text-center">
                Current Steps
              </h4>

              {steps.map((step, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-4 px-4 min-h-14 rounded-lg transition-all ${
                    step.status === 'in-progress' 
                      ? 'bg-pink-500/10 border border-pink-500/20' 
                      : 'bg-transparent'
                  }`}
                >
                  <div className="flex items-center gap-4 flex-1">
                    {/* Icon */}
                    <div className={`flex items-center justify-center shrink-0 w-10 h-10 ${
                      step.status === 'completed' ? 'text-pink-500' :
                      step.status === 'in-progress' ? 'text-pink-500' :
                      'text-gray-500'
                    }`}>
                      {step.status === 'completed' && (
                        <span className="material-symbols-outlined text-2xl">check_circle</span>
                      )}
                      {step.status === 'in-progress' && (
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-pink-500 border-t-transparent"></div>
                      )}
                      {step.status === 'pending' && (
                        <span className="material-symbols-outlined text-2xl">hourglass_empty</span>
                      )}
                    </div>

                    {/* Step Name */}
                    <p className={`text-base font-normal flex-1 ${
                      step.status === 'in-progress' ? 'text-white' :
                      step.status === 'completed' ? 'text-gray-400' :
                      'text-gray-500'
                    }`}>
                      {step.name}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Helper Text & Cancel Button */}
            <div className="flex flex-col items-center gap-6 pt-6">
              <p className="text-gray-400 text-sm text-center">
                This usually takes 2-5 minutes... Feel free to grab a coffee ☕
              </p>
              <button
                onClick={handleCancel}
                className="flex items-center justify-center gap-2 px-6 py-3 text-base font-medium text-gray-400 hover:text-white transition-colors"
              >
                Cancel Analysis
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading analysis...</p>
        </div>
      </div>
    }>
      <LoadingContent />
    </Suspense>
  );
}
