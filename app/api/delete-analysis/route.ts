import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function DELETE(request: NextRequest) {
  try {
    const { userId, repoId } = await request.json();

    if (!userId || !repoId) {
      return NextResponse.json(
        { error: 'Missing userId or repoId' },
        { status: 400 }
      );
    }

    // Delete user progress
    const progressRef = adminDb
      .collection('user_progress')
      .doc(userId)
      .collection('repos')
      .doc(repoId);

    await progressRef.delete();

    // Note: We don't delete the roadmap or repository data
    // as it might be used by other users (cached data)
    // We only delete the user's personal progress

    return NextResponse.json({ 
      success: true,
      message: 'Analysis deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting analysis:', error);
    return NextResponse.json(
      { error: 'Failed to delete analysis' },
      { status: 500 }
    );
  }
}
