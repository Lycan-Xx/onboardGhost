'use client';

import { useEffect, useState, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/contexts/AuthContext';

interface Analysis {
  repoId: string;
  repository_name: string;
  progress: number;
  started_at: Date;
  last_activity: Date;
  total_tasks: number;
  completed_tasks: number;
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading, isAuthenticated, hasGitHubToken, githubUser, signInAnonymous, initiateGitHubAuth } = useAuth();
  
  const [repoUrl, setRepoUrl] = useState('');
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loadingAnalyses, setLoadingAnalyses] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [repositories, setRepositories] = useState<any[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [repoSearch, setRepoSearch] = useState('');
  const [showRepoDropdown, setShowRepoDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle OAuth callback
  useEffect(() => {
    const oauth = searchParams.get('oauth');
    const errorParam = searchParams.get('error');

    if (oauth === 'success') {
      setError(null);
      // Reload analyses after successful OAuth
      if (user) {
        fetchAnalyses();
      }
    } else if (errorParam === 'oauth_not_configured') {
      setError('GitHub OAuth is not configured. Please check GITHUB_OAUTH_SETUP.md for setup instructions.');
    } else if (errorParam) {
      setError('GitHub authentication failed. Please try again.');
    }
  }, [searchParams, user]);

  // Auto sign-in anonymously if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      signInAnonymous();
    }
  }, [authLoading, isAuthenticated]);

  // Fetch user's analyses and repositories
  useEffect(() => {
    if (isAuthenticated && hasGitHubToken) {
      fetchAnalyses();
      fetchRepositories();
    }
  }, [isAuthenticated, hasGitHubToken]);

  const fetchAnalyses = async () => {
    if (!user) return;

    setLoadingAnalyses(true);
    try {
      const response = await fetch(`/api/user-analyses?userId=${user.uid}`);
      const data = await response.json();

      if (response.ok) {
        setAnalyses(data.analyses || []);
      } else {
        console.error('Failed to fetch analyses:', data.error);
      }
    } catch (err) {
      console.error('Error fetching analyses:', err);
    } finally {
      setLoadingAnalyses(false);
    }
  };

  const fetchRepositories = async () => {
    if (!user) return;

    setLoadingRepos(true);
    try {
      const response = await fetch(`/api/github/repos?userId=${user.uid}`);
      const data = await response.json();

      if (response.ok) {
        setRepositories(data.repositories || []);
      } else {
        console.error('Failed to fetch repositories:', data.error);
      }
    } catch (err) {
      console.error('Error fetching repositories:', err);
    } finally {
      setLoadingRepos(false);
    }
  };

  const handleAnalyze = async () => {
    if (!repoUrl.trim()) {
      setError('Please enter a repository URL');
      return;
    }

    // Check if authenticated user has reached the limit
    if (hasGitHubToken && analyses.length >= 2) {
      setError('You have reached the maximum of 2 analyses. Please delete one to continue.');
      return;
    }

    setAnalyzing(true);
    setError(null);

    try {
      // Generate repoId from URL immediately (must match API format)
      const repoId = repoUrl.replace('https://github.com/', '').replace('/', '-');

      // Get GitHub token if authenticated
      let githubToken = null;
      if (hasGitHubToken && user) {
        try {
          const tokenResponse = await fetch(`/api/github/token?userId=${user.uid}`);
          if (tokenResponse.ok) {
            const tokenData = await tokenResponse.json();
            githubToken = tokenData.token;
            console.log('[Dashboard] Retrieved GitHub token for private repo access');
          }
        } catch (err) {
          console.error('[Dashboard] Failed to get GitHub token:', err);
        }
      }

      // Redirect to loading page immediately
      router.push(`/loading?repoId=${repoId}`);

      // Start analysis in background (don't await)
      fetch('/api/analyze-repo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          repoUrl,
          userId: user?.uid || 'demo-user',
          saveProgress: true,
          githubToken,
        }),
      }).catch(err => {
        console.error('Analysis error:', err);
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setAnalyzing(false);
    }
  };

  const handleDelete = async (repoId: string) => {
    if (!user) return;

    try {
      const response = await fetch('/api/delete-analysis', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
          repoId,
        }),
      });

      if (response.ok) {
        // Remove from local state
        setAnalyses(analyses.filter(a => a.repoId !== repoId));
        setDeleteConfirm(null);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete analysis');
      }
    } catch (err) {
      setError('Failed to delete analysis');
    }
  };

  const handleContinue = (repoId: string) => {
    router.push(`/tasks?repoId=${repoId}`);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowRepoDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debug auth state
  useEffect(() => {
    console.log('Dashboard Auth Debug:', {
      hasGitHubToken,
      githubUser,
      isAuthenticated,
      userId: user?.uid,
      repositoriesCount: repositories.length,
    });
  }, [hasGitHubToken, githubUser, isAuthenticated, user, repositories]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <header className="w-full max-w-7xl mx-auto mb-12">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">OnboardGhost</h1>
          
          {/* GitHub Auth Button / Profile Link */}
          {hasGitHubToken && githubUser ? (
            <Link 
              href="/profile" 
              className="flex items-center gap-3 px-4 py-2 bg-[#1e293b] border border-gray-700 rounded-lg hover:border-pink-500/50 transition-all group"
            >
              <img 
                src={githubUser.avatar} 
                alt={githubUser.username}
                className="w-8 h-8 rounded-full"
              />
              <span className="text-white group-hover:text-pink-400 transition-colors">
                {githubUser.name}
              </span>
            </Link>
          ) : (
            <button
              onClick={initiateGitHubAuth}
              className="flex items-center gap-2 px-4 py-2 bg-pink-500 text-[#0a0a0f] font-semibold rounded-lg hover:bg-pink-600 transition-colors"
            >
              <span className="material-symbols-outlined">lock</span>
              <span>Sign in with GitHub</span>
            </button>
          )}
        </div>
      </header>

      {/* Welcome Section */}
      <main className="flex-grow w-full max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
            {hasGitHubToken ? 'Welcome Back' : 'Welcome to OnboardGhost'}
          </h2>
          <p className="text-gray-400">
            {hasGitHubToken 
              ? 'Select a repository to get started' 
              : 'Analyze any public repository to get started'}
          </p>
        </div>

        {/* Repository Input Section */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* Show dropdown only for authenticated users */}
            {hasGitHubToken && (
              <>
                <div ref={dropdownRef} className="relative w-full sm:w-80">
                  <input
                    type="text"
                    value={repoSearch}
                    onChange={(e) => {
                      setRepoSearch(e.target.value);
                      setShowRepoDropdown(true);
                    }}
                    onFocus={() => setShowRepoDropdown(true)}
                    placeholder="Search your repositories..."
                    className="w-full px-4 py-3 bg-[#1e293b] border border-gray-700 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    disabled={loadingRepos}
                  />
                  
                  {/* Dropdown */}
                  {showRepoDropdown && repositories.length > 0 && (
                    <div className="absolute z-10 w-full mt-2 bg-[#1e293b] border border-gray-700 rounded-lg shadow-xl max-h-64 overflow-y-auto">
                      {repositories
                        .filter(repo => 
                          repo.fullName.toLowerCase().includes(repoSearch.toLowerCase()) ||
                          repo.description?.toLowerCase().includes(repoSearch.toLowerCase())
                        )
                        .slice(0, 10)
                        .map(repo => (
                          <button
                            key={repo.id}
                            onClick={() => {
                              setRepoUrl(repo.url);
                              setRepoSearch(repo.fullName);
                              setShowRepoDropdown(false);
                            }}
                            className="w-full px-4 py-3 text-left hover:bg-pink-500/10 transition-colors border-b border-gray-700 last:border-b-0"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-white font-medium">{repo.fullName}</span>
                              {repo.private && (
                                <span className="text-xs px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded">
                                  Private
                                </span>
                              )}
                            </div>
                            {repo.description && (
                              <p className="text-sm text-gray-400 mt-1 truncate">
                                {repo.description}
                              </p>
                            )}
                            {repo.language && (
                              <span className="text-xs text-gray-500 mt-1 inline-block">
                                {repo.language}
                              </span>
                            )}
                          </button>
                        ))}
                    </div>
                  )}
                  
                  {loadingRepos && (
                    <div className="absolute right-3 top-3">
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-pink-500"></div>
                    </div>
                  )}
                </div>
                <span className="text-gray-500">OR</span>
              </>
            )}

            {/* URL Input */}
            <input
              type="text"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAnalyze()}
              placeholder={hasGitHubToken ? "Paste a repository link" : "Paste a public repository link"}
              className="flex-1 px-4 py-3 bg-[#1e293b] border border-gray-700 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              disabled={analyzing}
            />

            {/* Analyze Button */}
            <button
              onClick={handleAnalyze}
              disabled={analyzing || !repoUrl.trim()}
              className="px-8 py-3 bg-pink-500 text-[#0a0a0f] font-bold rounded-lg hover:bg-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {analyzing ? 'Analyzing...' : 'Analyze'}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-4 bg-red-900/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* One-Click Demos */}
          <div className="flex flex-wrap justify-center items-center gap-3 mt-8">
            <span className="text-gray-500 text-sm font-medium mr-2">Try a Demo:</span>
            {[
              { name: 'React', url: 'https://github.com/facebook/react' },
              { name: 'Redux', url: 'https://github.com/reduxjs/redux' },
              { name: 'Next.js', url: 'https://github.com/vercel/next.js' }
            ].map(demo => (
              <button
                key={demo.name}
                onClick={() => {
                  setRepoUrl(demo.url);
                }}
                className="px-4 py-1.5 bg-[#1e293b] border border-gray-700 rounded-full text-sm text-gray-300 hover:border-pink-500 hover:text-pink-400 focus:ring-2 focus:ring-pink-500/50 transition-all disabled:opacity-50"
                disabled={analyzing}
              >
                {demo.name}
              </button>
            ))}
          </div>
        </div>

        {/* Recent Analyses Section */}
        {hasGitHubToken && (
          <div className="max-w-6xl mx-auto">
            <h3 className="text-xl font-bold text-white mb-6">Recent Analyses</h3>

            {loadingAnalyses ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pink-500 mx-auto mb-4"></div>
                <p className="text-gray-400">Loading your analyses...</p>
              </div>
            ) : analyses.length === 0 ? (
              <div className="text-center py-12 bg-[#1e293b] border border-gray-700 rounded-lg">
                <span className="material-symbols-outlined text-6xl text-gray-600 mb-4">folder_open</span>
                <p className="text-gray-400 mb-2">No analyses yet</p>
                <p className="text-gray-500 text-sm">Analyze a repository to get started</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {analyses.map((analysis) => (
                  <div
                    key={analysis.repoId}
                    className="bg-[#1e293b] border border-gray-700 rounded-lg p-6 hover:border-pink-500/50 transition-all group relative"
                  >
                    {/* Delete Confirmation Overlay */}
                    {deleteConfirm === analysis.repoId && (
                      <div className="absolute inset-0 bg-[#0a0a0f]/95 rounded-lg flex flex-col items-center justify-center p-6 z-10">
                        <p className="text-white text-center mb-4">
                          Delete this analysis?
                        </p>
                        <p className="text-gray-400 text-sm text-center mb-6">
                          This will remove all progress for {analysis.repository_name}
                        </p>
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleDelete(analysis.repoId)}
                            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Delete Button */}
                    <button
                      onClick={() => setDeleteConfirm(analysis.repoId)}
                      className="absolute top-4 right-4 text-gray-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <span className="material-symbols-outlined text-xl">delete</span>
                    </button>

                    {/* Repository Name */}
                    <h4 className="text-lg font-semibold text-white mb-2 pr-8">
                      {analysis.repository_name}
                    </h4>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-400 mb-2">
                        <span>{analysis.completed_tasks} / {analysis.total_tasks} tasks</span>
                        <span>{analysis.progress}% complete</span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-2">
                        <div
                          className="bg-pink-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${analysis.progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Continue Button */}
                    <button
                      onClick={() => handleContinue(analysis.repoId)}
                      className="w-full px-4 py-2 bg-pink-500/10 text-pink-400 font-semibold rounded-lg hover:bg-pink-500/20 transition-colors"
                    >
                      Continue
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Limit Warning */}
            {analyses.length >= 2 && (
              <div className="mt-6 p-4 bg-yellow-900/20 border border-yellow-500/50 rounded-lg text-yellow-300 text-sm text-center">
                You've reached the maximum of 2 analyses. Delete one to analyze a new repository.
              </div>
            )}
          </div>
        )}

        {/* Not Authenticated Message */}
        {!hasGitHubToken && (
          <div className="max-w-2xl mx-auto text-center py-12 bg-[#1e293b] border border-gray-700 rounded-lg">
            <span className="material-symbols-outlined text-6xl text-pink-500 mb-4">psychology</span>
            <h3 className="text-xl font-bold text-white mb-2">
              Sign in to unlock full features
            </h3>
            <p className="text-gray-400 mb-2">
              You can analyze public repositories without signing in, but your progress won't be saved.
            </p>
            <p className="text-gray-400 mb-6">
              Sign in with GitHub to save your analyses, track progress, and access private repositories.
            </p>
            <button
              onClick={initiateGitHubAuth}
              className="px-6 py-3 bg-pink-500 text-[#0a0a0f] font-bold rounded-lg hover:bg-pink-600 transition-all inline-flex items-center gap-2"
            >
              <span className="material-symbols-outlined">lock</span>
              Sign in with GitHub
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
