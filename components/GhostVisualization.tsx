'use client';

interface GhostVisualizationProps {
  progress: number; // 0-100
  showCelebration?: boolean;
}

export default function GhostVisualization({ progress }: GhostVisualizationProps) {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="flex items-center gap-4 w-full">
        <span className="text-sm font-medium text-purple-600">
          {progress}%
        </span>
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div
            className="bg-purple-600 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}
