import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { handleAPIError } from '@/lib/utils/errors';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const repoId = searchParams.get('repoId');
    const userId = searchParams.get('userId');

    if (!repoId || !userId) {
      return NextResponse.json(
        { error: 'Missing required parameters: repoId, userId' },
        { status: 400 }
      );
    }

    // Get roadmap
    const roadmapRef = adminDb.collection('roadmaps').doc(repoId);
    const roadmapDoc = await roadmapRef.get();

    if (!roadmapDoc.exists) {
      return NextResponse.json(
        { error: 'Roadmap not found' },
        { status: 404 }
      );
    }

    // Get user progress
    const progressRef = adminDb.collection('user_progress').doc(userId).collection('repos').doc(repoId);
    const progressDoc = await progressRef.get();

    const roadmap = roadmapDoc.data();
    const progress = progressDoc.exists ? progressDoc.data() : {
      completed_tasks: [],
      overall_progress_percentage: 0,
      ghost_solidness: 0,
    };

    return NextResponse.json({
      success: true,
      roadmap,
      progress,
    });
  } catch (error) {
    const apiError = handleAPIError(error);
    return NextResponse.json(
      { error: apiError.message, code: apiError.code },
      { status: apiError.statusCode }
    );
  }
}
