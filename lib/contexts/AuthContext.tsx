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

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  hasGitHubToken: boolean;
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // Check if user has GitHub token
        await checkGitHubToken();
      } else {
        setHasGitHubToken(false);
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

  const checkGitHubToken = async (): Promise<boolean> => {
    if (!user) {
      setHasGitHubToken(false);
      return false;
    }

    try {
      const response = await fetch(`/api/auth/check-github?userId=${user.uid}`);
      const data = await response.json();
      setHasGitHubToken(data.hasToken || false);
      return data.hasToken || false;
    } catch (error) {
      console.error('Error checking GitHub token:', error);
      setHasGitHubToken(false);
      return false;
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    hasGitHubToken,
    signInAnonymous,
    signOut,
    initiateGitHubAuth,
    checkGitHubToken,
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
