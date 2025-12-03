import { adminDb } from '@/lib/firebase/admin';

/**
 * Retrieves and decrypts the GitHub OAuth token for a user
 */
export async function getGitHubToken(userId: string): Promise<string | null> {
  try {
    const tokenRef = adminDb.collection('github_tokens').doc(userId);
    const tokenDoc = await tokenRef.get();

    if (!tokenDoc.exists) {
      return null;
    }

    const data = tokenDoc.data();
    if (!data) {
      return null;
    }
    
    const encryptedToken = data.encrypted_token;

    if (!encryptedToken) {
      return null;
    }

    // Decrypt token (simple base64 for now - in production use proper encryption)
    const decryptedToken = Buffer.from(encryptedToken, 'base64').toString();

    return decryptedToken;
  } catch (error) {
    console.error('Error retrieving GitHub token:', error);
    return null;
  }
}

/**
 * Checks if a user has a valid GitHub OAuth token
 */
export async function hasGitHubToken(userId: string): Promise<boolean> {
  const token = await getGitHubToken(userId);
  return token !== null;
}
