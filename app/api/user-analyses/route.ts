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

    // Get user's analyses from user_progress collection
    const progressRef = adminDb
      .collection('user_progress')
      .doc(userId)
      .collection('repos');

    const snapshot = await progressRef.get();

    if (snapshot.empty) {
      return NextResponse.json({ analyses: [] });
    }

    // Fetch roadmap details for each analysis
    const analyses = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const progressData = doc.data();
        const repoId = doc.id;

        // Get roadmap details
        const roadmapRef = adminDb.collection('roadmaps').doc(repoId);
        const roadmapDoc = await roadmapRef.get();

        if (!roadmapDoc.exists) {
          return null;
        }

        const roadmapData = roadmapDoc.data();

        return {
          repoId,
          repository_name: roadmapData?.repository_name || 'Unknown',
          progress: progressData.overall_progress_percentage || 0,
          started_at: progressData.started_at?.toDate?.() || new Date(),
          last_activity: progressData.last_activity?.toDate?.() || new Date(),
          total_tasks: roadmapData?.total_tasks || 0,
          completed_tasks: progressData.completed_tasks?.length || 0,
        };
      })
    );

    // Filter out null values and sort by last activity
    const validAnalyses = analyses
      .filter((a) => a !== null)
      .sort((a, b) => b!.last_activity.getTime() - a!.last_activity.getTime());

    return NextResponse.json({ analyses: validAnalyses });
  } catch (error) {
    console.error('Error fetching user analyses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analyses' },
      { status: 500 }
    );
  }
}
