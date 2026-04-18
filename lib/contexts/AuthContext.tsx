'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User,
  signInAnonymously,
  onAuthStateChanged,
  signOut as firebaseSignOut
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface GitHubUser {
  username: string;
  avatar: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  hasGitHubToken: boolean;
  githubUser: GitHubUser | null;
  signInAnonymous: () => Promise<void>;
  signOut: () => Promise<void>;
  initiateGitHubAuth: () => void;
  checkGitHubToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasGitHubToken, setHasGitHubToken] = useState(false);
  const [githubUser, setGithubUser] = useState<GitHubUser | null>(null);

  const checkGitHubToken = async (userId: string): Promise<boolean> => {
    console.log('[AuthContext] Checking GitHub token for user:', userId);
    
    try {
      // Add retry logic for production - sometimes Firestore has replication lag
      for (let attempt = 1; attempt <= 3; attempt++) {
        const response = await fetch(`/api/auth/check-github?userId=${userId}`);
        const data = await response.json();
        
        console.log(`[AuthContext] GitHub token check result (attempt ${attempt}):`, data);
        
        setHasGitHubToken(data.hasToken || false);
        
        if (data.hasToken) {
          if (data.githubUser) {
            console.log('[AuthContext] GitHub user found:', data.githubUser);
            setGithubUser(data.githubUser);
          }
          return true;
        }
        
        // If token not found and this isn't the last attempt, wait before retrying
        if (attempt < 3) {
          console.log('[AuthContext] Token not found, retrying in 1 second...');
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      console.log('[AuthContext] No GitHub token found after retries');
      setGithubUser(null);
      return false;
    } catch (error) {
      console.error('[AuthContext] Error checking GitHub token:', error);
      setHasGitHubToken(false);
      setGithubUser(null);
      return false;
    }
  };

  useEffect(() => {
    if (!auth) {
      console.error('Firebase Auth is not initialized');
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('[AuthContext] Auth state changed:', firebaseUser?.uid || 'no user');
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // Check if user has GitHub token
        await checkGitHubToken(firebaseUser.uid);
      } else {
        setHasGitHubToken(false);
        setGithubUser(null);
      }
      
      setLoading(false);
    });

    // Also check GitHub token after page loads to handle OAuth callback redirects
    const timer = setTimeout(() => {
      if (user) {
        checkGitHubToken(user.uid);
      }
    }, 2000);

    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  const signInAnonymous = async () => {
    try {
      const result = await signInAnonymously(auth);
      setUser(result.user);
    } catch (error: any) {
      console.error('Anonymous sign-in error:', error);
      
      // Check if anonymous auth is disabled
      if (error?.code === 'auth/operation-not-allowed') {
        console.error('Anonymous authentication is not enabled in Firebase Console.');
        console.error('Please enable it: Firebase Console > Authentication > Sign-in method > Anonymous');
      }
      
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setHasGitHubToken(false);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  const initiateGitHubAuth = async () => {
    try {
      // If no user, sign in anonymously first
      if (!user) {
        const result = await signInAnonymously(auth);
        // Redirect to GitHub OAuth with the new user
        window.location.href = `/api/auth/github?userId=${result.user.uid}`;
        return;
      }
      
      // Redirect to GitHub OAuth
      window.location.href = `/api/auth/github?userId=${user.uid}`;
    } catch (error) {
      console.error('Failed to initiate GitHub auth:', error);
      throw error;
    }
  };



  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    hasGitHubToken,
    githubUser,
    signInAnonymous,
    signOut,
    initiateGitHubAuth,
    checkGitHubToken: () => user ? checkGitHubToken(user.uid) : Promise.resolve(false),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
