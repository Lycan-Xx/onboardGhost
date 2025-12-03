'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function Dashboard() {
  const [repoUrl, setRepoUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [oauthStatus, setOauthStatus] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check for OAuth status
    const oauth = searchParams.get('oauth');
    const errorParam = searchParams.get('error');
    
    if (oauth === 'success') {
      setOauthStatus('GitHub connected successfully! You can now analyze private repositories.');
    } else if (errorParam) {
      setOauthStatus(`OAuth failed: ${errorParam}`);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic URL validation
    if (!repoUrl.includes('github.com')) {
      setError('Please enter a valid GitHub repository URL');
      return;
    }

    setIsAnalyzing(true);

    try {
      const response = await fetch('/api/analyze-repo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          repoUrl,
          userId: 'demo-user', // In production, get from auth
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Analysis failed');
      }

      // Redirect to loading page with repo ID
      router.push(`/loading?repoId=${data.repoId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsAnalyzing(false);
    }
  };

  const handleConnectGitHub = () => {
    window.location.href = '/api/auth/github?userId=demo-user';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <header className="flex justify-between items-center mb-16">
          <div className="flex items-center gap-3">
            <span className="text-4xl">👻</span>
            <span className="text-2xl font-bold text-white">OnboardGhost</span>
          </div>
          <Link href="/profile">
            <button className="w-12 h-12 flex items-center justify-center bg-white/10 border border-white/20 rounded-full hover:bg-white/20 transition-all duration-300">
              <span className="text-white text-2xl">👤</span>
            </button>
          </Link>
        </header>

        <div className="max-w-2xl mx-auto">
          {/* Title */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-white mb-4">
              Welcome Back
            </h1>
            <p className="text-xl text-gray-300">
              AI-powered repository analysis and onboarding roadmaps
            </p>
          </div>

          {/* OAuth Status */}
          {oauthStatus && (
            <div className={`mb-6 p-4 rounded-lg ${
              oauthStatus.includes('success') 
                ? 'bg-green-100 text-green-800 border border-green-300' 
                : 'bg-red-100 text-red-800 border border-red-300'
            }`}>
              {oauthStatus}
            </div>
          )}

          {/* Main Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <input
                type="url"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/owner/repository"
                className="w-full px-6 py-4 text-lg rounded-lg border-2 border-white/20 bg-white/10 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm"
                disabled={isAnalyzing}
                required
              />
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isAnalyzing}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold py-4 px-6 rounded-lg text-lg transition-colors shadow-lg"
            >
              {isAnalyzing ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⚙️</span>
                  Analyzing Repository...
                </span>
              ) : (
                'Analyze Repository'
              )}
            </button>
          </form>

          {/* GitHub OAuth */}
          <div className="mt-8 text-center">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1 border-t border-white/20"></div>
              <span className="text-gray-300">Optional</span>
              <div className="flex-1 border-t border-white/20"></div>
            </div>
            
            <button
              onClick={handleConnectGitHub}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors border border-gray-600"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              Connect GitHub for Private Repos
            </button>
          </div>

          {/* Info */}
          <div className="mt-8 text-center space-y-2">
            <p className="text-sm text-gray-400">
              ✅ Public repositories work immediately
            </p>
            <p className="text-sm text-gray-400">
              🔒 Connect GitHub to analyze private repositories
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
