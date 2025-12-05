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

    // Check if user has GitHub token
    const tokenRef = adminDb.collection('github_tokens').doc(userId);
    const tokenDoc = await tokenRef.get();

    return NextResponse.json({
      hasToken: tokenDoc.exists,
    });
  } catch (error) {
    console.error('Error checking GitHub token:', error);
    return NextResponse.json(
      { error: 'Failed to check GitHub token', hasToken: false },
      { status: 500 }
    );
  }
}
