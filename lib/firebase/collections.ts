import { collection, CollectionReference, DocumentData } from 'firebase/firestore';
import { db } from './config';
import {
  RepositoryMetadata,
  OnboardingRoadmap,
  UserProgress,
  ChatMessage,
  AnalysisProgress,
} from '../types';

// Firestore collection references with proper typing

export const repositoriesCollection = () =>
  collection(db, 'repositories') as CollectionReference<RepositoryMetadata>;

export const roadmapsCollection = () =>
  collection(db, 'roadmaps') as CollectionReference<OnboardingRoadmap>;

export const analysisProgressCollection = () =>
  collection(db, 'analysis_progress') as CollectionReference<AnalysisProgress>;

// User-specific subcollections
export const userProgressCollection = (userId: string) =>
  collection(db, `user_progress/${userId}/repos`) as CollectionReference<UserProgress>;

export const chatHistoryCollection = (userId: string, repoId: string) =>
  collection(
    db,
    `chat_history/${userId}/repos/${repoId}/messages`
  ) as CollectionReference<ChatMessage>;

// Collection names as constants
export const COLLECTIONS = {
  REPOSITORIES: 'repositories',
  ROADMAPS: 'roadmaps',
  ANALYSIS_PROGRESS: 'analysis_progress',
  USER_PROGRESS: 'user_progress',
  CHAT_HISTORY: 'chat_history',
} as const;
