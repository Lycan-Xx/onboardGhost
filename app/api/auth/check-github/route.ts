import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    console.log('[check-github] Checking token for userId:', userId);

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    // Check if user has GitHub token
    const tokenRef = adminDb.collection('github_tokens').doc(userId);
    const tokenDoc = await tokenRef.get();

    console.log('[check-github] Token document exists:', tokenDoc.exists);

    if (!tokenDoc.exists) {
      return NextResponse.json({
        hasToken: false,
      });
    }

    const data = tokenDoc.data();
    console.log('[check-github] Token data:', {
      hasUsername: !!data?.github_username,
      hasAvatar: !!data?.github_avatar,
      hasName: !!data?.github_name,
    });
    
    return NextResponse.json({
      hasToken: true,
      githubUser: data?.github_username ? {
        username: data.github_username,
        avatar: data.github_avatar,
        name: data.github_name,
      } : null,
    });
  } catch (error) {
    console.error('[check-github] Error:', error);
    return NextResponse.json(
      { error: 'Failed to check GitHub token', hasToken: false },
      { status: 500 }
    );
  }
}
