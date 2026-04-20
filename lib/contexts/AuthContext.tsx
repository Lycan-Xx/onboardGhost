'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  signInAnonymously,
  onAuthStateChanged,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase/config';

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
  githubLoading: boolean;
  googleLoading: boolean;
  signInAnonymous: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
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
  const [githubLoading, setGithubLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const checkGitHubToken = async (userId: string): Promise<boolean> => {
    try {
      for (let attempt = 1; attempt <= 3; attempt++) {
        const response = await fetch(`/api/auth/check-github?userId=${userId}`);
        const data = await response.json();
        setHasGitHubToken(data.hasToken || false);
        if (data.hasToken) {
          if (data.githubUser) setGithubUser(data.githubUser);
          return true;
        }
        if (attempt < 3) await new Promise(resolve => setTimeout(resolve, 1000));
      }
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
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await checkGitHubToken(firebaseUser.uid);
      } else {
        setHasGitHubToken(false);
        setGithubUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInAnonymous = async () => {
    try {
      const result = await signInAnonymously(auth);
      setUser(result.user);
    } catch (error: any) {
      console.error('Anonymous sign-in error:', error);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      setGoogleLoading(true);
      const provider = new GoogleAuthProvider();
      // Always show account picker / consent — fixes silent auto-login complaint
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      setUser(result.user);
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      throw error;
    } finally {
      setGoogleLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setHasGitHubToken(false);
      setGithubUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  const initiateGitHubAuth = async () => {
    try {
      setGithubLoading(true);
      if (!user) {
        const result = await signInAnonymously(auth);
        window.location.href = `/api/auth/github?userId=${result.user.uid}`;
        return;
      }
      window.location.href = `/api/auth/github?userId=${user.uid}`;
    } catch (error) {
      setGithubLoading(false);
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
    githubLoading,
    googleLoading,
    signInAnonymous,
    signInWithGoogle,
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
