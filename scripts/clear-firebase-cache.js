#!/usr/bin/env node

/**
 * Simple script to clear Firebase/Firestore cache
 * Usage: node scripts/clear-firebase-cache.js [option]
 *
 * Options:
 *   --all        Clear all cached content (default)
 *   --repos      Clear only repository analysis cache
 *   --users      Clear only user data (progress and chat)
 *   --help       Show this help message
 */

const admin = require('firebase-admin');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
    : undefined;

  admin.initializeApp({
    credential: serviceAccount
      ? admin.credential.cert(serviceAccount)
      : admin.credential.applicationDefault(),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
}

const db = admin.firestore();

/**
 * Clear all documents from a collection
 */
async function clearCollection(collectionName) {
  console.log(`🗑️ Clearing collection: ${collectionName}`);

  const collectionRef = db.collection(collectionName);
  const snapshot = await collectionRef.get();

  if (snapshot.empty) {
    console.log(`  📭 Collection ${collectionName} is already empty`);
    return 0;
  }

  const batch = db.batch();
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
async function clearUserProgress() {
  console.log(`🗑️ Clearing user progress subcollections`);

  const userProgressRef = db.collection('user_progress');
  const userSnapshots = await userProgressRef.listDocuments();

  let totalDeleted = 0;

  for (const userDoc of userSnapshots) {
    const userId = userDoc.id;
    console.log(`  👤 Clearing data for user: ${userId}`);

    // Clear repos subcollection
    const reposRef = userDoc.collection('repos');
    const reposSnapshot = await reposRef.get();

    if (!reposSnapshot.empty) {
      const batch = db.batch();
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
async function clearChatHistory() {
  console.log(`🗑️ Clearing chat history subcollections`);

  const chatHistoryRef = db.collection('chat_history');
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
        const batch = db.batch();
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
async function clearAllCachedContent() {
  console.log('🚨 Starting Firebase cache clearing process...');
  console.log('⚠️  This will permanently delete ALL data from your database!');
  console.log('');

  try {
    let totalDeleted = 0;

    // Clear main collections
    totalDeleted += await clearCollection('repositories');
    totalDeleted += await clearCollection('roadmaps');
    totalDeleted += await clearCollection('analysis_progress');

    // Clear subcollections
    totalDeleted += await clearUserProgress();
    totalDeleted += await clearChatHistory();

    console.log('');
    console.log('🎉 Cache clearing completed successfully!');
    console.log(`📊 Total documents deleted: ${totalDeleted}`);
    console.log('');
    console.log('💡 Your Firebase database is now clean and ready for fresh data.');

  } catch (error) {
    console.error('❌ Error clearing cache:', error.message);
    throw error;
  }
}

/**
 * Clear only repository analysis cache (keeps user progress)
 */
async function clearRepositoryCache() {
  console.log('🧹 Clearing repository analysis cache...');

  try {
    let totalDeleted = 0;

    totalDeleted += await clearCollection('repositories');
    totalDeleted += await clearCollection('roadmaps');
    totalDeleted += await clearCollection('analysis_progress');

    console.log(`✅ Cleared ${totalDeleted} repository-related documents`);
    console.log('💡 User progress and chat history preserved');

  } catch (error) {
    console.error('❌ Error clearing repository cache:', error.message);
    throw error;
  }
}

/**
 * Clear only user data (progress and chat history)
 */
async function clearUserData() {
  console.log('🧹 Clearing user data...');

  try {
    let totalDeleted = 0;

    totalDeleted += await clearUserProgress();
    totalDeleted += await clearChatHistory();

    console.log(`✅ Cleared ${totalDeleted} user-related documents`);
    console.log('💡 Repository analysis data preserved');

  } catch (error) {
    console.error('❌ Error clearing user data:', error.message);
    throw error;
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const option = args[0] || '--all';

  console.log('🔥 Firebase Cache Clearing Tool');
  console.log('================================\n');

  try {
    switch (option) {
      case '--all':
        console.log('🗑️ Clearing ALL cached content...\n');
        await clearAllCachedContent();
        break;

      case '--repos':
        console.log('📦 Clearing repository analysis cache...\n');
        await clearRepositoryCache();
        break;

      case '--users':
        console.log('👥 Clearing user data...\n');
        await clearUserData();
        break;

      case '--help':
      default:
        console.log('Usage: node scripts/clear-firebase-cache.js [option]\n');
        console.log('Options:');
        console.log('  --all     Clear all cached content (repositories, roadmaps, progress, chat) (default)');
        console.log('  --repos   Clear only repository analysis cache (keeps user progress)');
        console.log('  --users   Clear only user data (progress and chat history)');
        console.log('  --help    Show this help message\n');
        console.log('Examples:');
        console.log('  node scripts/clear-firebase-cache.js');
        console.log('  node scripts/clear-firebase-cache.js --repos');
        console.log('  node scripts/clear-firebase-cache.js --users\n');
        console.log('⚠️  Make sure your .env.local file has the required Firebase environment variables!');
        break;
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    // Close the Firebase app
    await admin.app().delete();
  }
}

main();
