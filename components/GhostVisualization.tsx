'use client';

import { useEffect, useState } from 'react';

interface GhostVisualizationProps {
  progress: number; // 0-100
  showCelebration?: boolean;
}

export default function GhostVisualization({ progress, showCelebration = false }: GhostVisualizationProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (showCelebration) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [showCelebration]);

  // Calculate opacity based on progress (0-100)
  const opacity = Math.max(0.1, progress / 100);

  return (
    <div className="relative flex items-center justify-center">
      {/* Ghost SVG */}
      <div 
        className={`transition-all duration-1000 ${
          isAnimating ? 'animate-bounce scale-110' : ''
        }`}
        style={{ opacity }}
      >
        <svg
          width="120"
          height="140"
          viewBox="0 0 120 140"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-lg"
        >
          {/* Ghost Body */}
          <path
            d="M60 20C35 20 15 40 15 65V120C15 125 20 130 25 130C30 130 35 125 40 125C45 125 50 130 55 130C60 130 65 125 70 125C75 125 80 130 85 130C90 130 95 125 100 125C105 125 105 130 105 120V65C105 40 85 20 60 20Z"
            fill="white"
            stroke="#E5E7EB"
            strokeWidth="2"
          />
          {/* Eyes */}
          <circle cx="45" cy="55" r="6" fill="#374151" />
          <circle cx="75" cy="55" r="6" fill="#374151" />
          {/* Eye highlights */}
          <circle cx="47" cy="53" r="2" fill="white" />
          <circle cx="77" cy="53" r="2" fill="white" />
          {/* Mouth */}
          <ellipse cx="60" cy="75" rx="8" ry="6" fill="#374151" />
        </svg>
      </div>

      {/* Progress Text */}
      <div className="absolute -bottom-8 text-center">
        <div className="text-lg font-semibold text-gray-700">
          {progress}%
        </div>
        <div className="text-sm text-gray-500">
          Ghost Solidness
        </div>
      </div>

      {/* Celebration Effects */}
      {isAnimating && (
        <div className="absolute inset-0 pointer-events-none">
          {/* Sparkles */}
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-ping"
              style={{
                left: `${20 + (i * 10)}%`,
                top: `${10 + (i % 3) * 20}%`,
                animationDelay: `${i * 0.1}s`,
              }}
            >
              ✨
            </div>
          ))}
        </div>
      )}

      {/* Milestone Messages */}
      {showCelebration && (
        <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-purple-600 text-white px-4 py-2 rounded-lg shadow-lg animate-bounce">
          <div className="text-center">
            <div className="font-semibold">🎉 Milestone Reached!</div>
            <div className="text-sm">Keep up the great work!</div>
          </div>
          {/* Speech bubble arrow */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-purple-600"></div>
        </div>
      )}
    </div>
  );
}
