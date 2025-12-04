/**
 * Utility script to clear all cached content from Firebase/Firestore
 * Run this to reset the database to a clean state
 */

import { adminDb } from './admin';
import { COLLECTIONS } from './collections';

/**
 * Clear all documents from a collection
 */
async function clearCollection(collectionName: string): Promise<number> {
  console.log(`🗑️ Clearing collection: ${collectionName}`);

  const collectionRef = adminDb.collection(collectionName);
  const snapshot = await collectionRef.get();

  if (snapshot.empty) {
    console.log(`  📭 Collection ${collectionName} is already empty`);
    return 0;
  }

  const batch = adminDb.batch();
  let deletedCount = 0;

  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
    deletedCount++;
  });

  await batch.commit();
  console.log(`  ✅ Deleted ${deletedCount} documents from ${collectionName}`);
  return deletedCount;
}

/**
 * Clear user progress subcollections
 */
async function clearUserProgress(): Promise<number> {
  console.log(`🗑️ Clearing user progress subcollections`);

  const userProgressRef = adminDb.collection('user_progress');
  const userSnapshots = await userProgressRef.listDocuments();

  let totalDeleted = 0;

  for (const userDoc of userSnapshots) {
    const userId = userDoc.id;
    console.log(`  👤 Clearing data for user: ${userId}`);

    // Clear repos subcollection
    const reposRef = userDoc.collection('repos');
    const reposSnapshot = await reposRef.get();

    if (!reposSnapshot.empty) {
      const batch = adminDb.batch();
      reposSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      console.log(`    ✅ Deleted ${reposSnapshot.size} repos for user ${userId}`);
      totalDeleted += reposSnapshot.size;
    }
  }

  return totalDeleted;
}

/**
 * Clear chat history subcollections
 */
async function clearChatHistory(): Promise<number> {
  console.log(`🗑️ Clearing chat history subcollections`);

  const chatHistoryRef = adminDb.collection('chat_history');
  const userSnapshots = await chatHistoryRef.listDocuments();

  let totalDeleted = 0;

  for (const userDoc of userSnapshots) {
    const userId = userDoc.id;
    console.log(`  👤 Clearing chat history for user: ${userId}`);

    const reposRef = userDoc.collection('repos');
    const repoSnapshots = await reposRef.listDocuments();

    for (const repoDoc of repoSnapshots) {
      const repoId = repoDoc.id;

      const messagesRef = repoDoc.collection('messages');
      const messagesSnapshot = await messagesRef.get();

      if (!messagesSnapshot.empty) {
        const batch = adminDb.batch();
        messagesSnapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });
        await batch.commit();
        console.log(`    ✅ Deleted ${messagesSnapshot.size} messages for repo ${repoId}`);
        totalDeleted += messagesSnapshot.size;
      }
    }
  }

  return totalDeleted;
}

/**
 * Clear all cached content from Firebase
 */
export async function clearAllCachedContent(): Promise<void> {
  console.log('🚨 Starting Firebase cache clearing process...');
  console.log('⚠️  This will permanently delete ALL data from your database!');
  console.log('');

  try {
    let totalDeleted = 0;

    // Clear main collections
    totalDeleted += await clearCollection(COLLECTIONS.REPOSITORIES);
    totalDeleted += await clearCollection(COLLECTIONS.ROADMAPS);
    totalDeleted += await clearCollection(COLLECTIONS.ANALYSIS_PROGRESS);

    // Clear subcollections
    totalDeleted += await clearUserProgress();
    totalDeleted += await clearChatHistory();

    console.log('');
    console.log('🎉 Cache clearing completed successfully!');
    console.log(`📊 Total documents deleted: ${totalDeleted}`);
    console.log('');
    console.log('💡 Your Firebase database is now clean and ready for fresh data.');

  } catch (error) {
    console.error('❌ Error clearing cache:', error);
    throw error;
  }
}

/**
 * Clear only repository analysis cache (keeps user progress)
 */
export async function clearRepositoryCache(): Promise<void> {
  console.log('🧹 Clearing repository analysis cache...');

  try {
    let totalDeleted = 0;

    totalDeleted += await clearCollection(COLLECTIONS.REPOSITORIES);
    totalDeleted += await clearCollection(COLLECTIONS.ROADMAPS);
    totalDeleted += await clearCollection(COLLECTIONS.ANALYSIS_PROGRESS);

    console.log(`✅ Cleared ${totalDeleted} repository-related documents`);
    console.log('💡 User progress and chat history preserved');

  } catch (error) {
    console.error('❌ Error clearing repository cache:', error);
    throw error;
  }
}

/**
 * Clear only user data (progress and chat history)
 */
export async function clearUserData(): Promise<void> {
  console.log('🧹 Clearing user data...');

  try {
    let totalDeleted = 0;

    totalDeleted += await clearUserProgress();
    totalDeleted += await clearChatHistory();

    console.log(`✅ Cleared ${totalDeleted} user-related documents`);
    console.log('💡 Repository analysis data preserved');

  } catch (error) {
    console.error('❌ Error clearing user data:', error);
    throw error;
  }
}
