import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    // Get user's GitHub token
    const tokenRef = adminDb.collection('github_tokens').doc(userId);
    const tokenDoc = await tokenRef.get();

    if (!tokenDoc.exists) {
      return NextResponse.json(
        { error: 'GitHub token not found' },
        { status: 404 }
      );
    }

    const tokenData = tokenDoc.data();
    const encryptedToken = tokenData?.encrypted_token;

    if (!encryptedToken) {
      return NextResponse.json(
        { error: 'Invalid token data' },
        { status: 400 }
      );
    }

    // Decrypt token
    const accessToken = Buffer.from(encryptedToken, 'base64').toString();

    return NextResponse.json({ token: accessToken });
  } catch (error) {
    console.error('Error fetching GitHub token:', error);
    return NextResponse.json(
      { error: 'Failed to fetch token' },
      { status: 500 }
    );
  }
}
