'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/contexts/AuthContext';

export default function Profile() {
  const router = useRouter();
  const { user, loading, hasGitHubToken, signOut, initiateGitHubAuth } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    router.push('/dashboard');
  };

  if (loading) {
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
          <Link 
            href="/dashboard" 
            className="flex items-center gap-2 text-gray-400 hover:text-pink-400 transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
            <span>Return to Dashboard</span>
          </Link>
        </div>
      </header>

      {/* Profile Content */}
      <main className="flex-grow w-full max-w-2xl mx-auto">
        <div className="bg-[#1e293b] border border-gray-700 rounded-lg p-8">
          <h1 className="text-2xl font-bold text-white mb-6">Profile</h1>

          {/* User Info */}
          <div className="space-y-4 mb-8">
            <div>
              <label className="text-sm text-gray-400 block mb-1">User ID</label>
              <p className="text-white font-mono text-sm">{user?.uid || 'Not signed in'}</p>
            </div>

            <div>
              <label className="text-sm text-gray-400 block mb-1">GitHub Connection</label>
              <div className="flex items-center gap-3">
                {hasGitHubToken ? (
                  <>
                    <span className="material-symbols-outlined text-green-400">check_circle</span>
                    <span className="text-white">Connected</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-gray-500">cancel</span>
                    <span className="text-gray-400">Not connected</span>
                    {user && (
                      <button
                        onClick={initiateGitHubAuth}
                        className="ml-auto px-4 py-2 bg-pink-500 text-[#0a0a0f] font-semibold rounded-lg hover:bg-pink-600 transition-colors text-sm"
                      >
                        Connect GitHub
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-6 border-t border-gray-700">
            <button
              onClick={handleSignOut}
              className="px-6 py-3 bg-red-500/10 text-red-400 font-semibold rounded-lg hover:bg-red-500/20 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
