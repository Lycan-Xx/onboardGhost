import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { handleAPIError } from '@/lib/utils/errors';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, repoId, taskId, completed } = body;

    // Validate inputs
    if (!userId || !repoId || !taskId || typeof completed !== 'boolean') {
      return NextResponse.json(
        { error: 'Missing required fields: userId, repoId, taskId, completed' },
        { status: 400 }
      );
    }

    // Get current progress — auto-create (upsert) if document doesn't exist yet.
    // This handles repos that were analyzed before the progress-init fix,
    // as well as anonymous users whose progress was never seeded.
    const progressRef = adminDb.collection('user_progress').doc(userId).collection('repos').doc(repoId);
    const progressDoc = await progressRef.get();

    // If missing, seed a fresh progress document so the update below always succeeds
    if (!progressDoc.exists) {
      await progressRef.set({
        user_id: userId,
        repo_id: repoId,
        completed_tasks: [],
        overall_progress_percentage: 0,
        ghost_solidness: 0,
        started_at: new Date(),
        last_activity: new Date(),
      });
    }

    const currentProgress = progressDoc.exists ? progressDoc.data() : { completed_tasks: [], overall_progress_percentage: 0 };
    if (!currentProgress) {
      return NextResponse.json(
        { error: 'Progress data not found' },
        { status: 404 }
      );
    }
    
    let completedTasks: string[] = currentProgress.completed_tasks || [];

    // Update completed tasks array
    if (completed && !completedTasks.includes(taskId)) {
      completedTasks.push(taskId);
    } else if (!completed && completedTasks.includes(taskId)) {
      completedTasks = completedTasks.filter((id: string) => id !== taskId);
    }

    // Get roadmap to calculate total tasks
    const roadmapRef = adminDb.collection('roadmaps').doc(repoId);
    const roadmapDoc = await roadmapRef.get();

    if (!roadmapDoc.exists) {
      return NextResponse.json(
        { error: 'Roadmap not found' },
        { status: 404 }
      );
    }

    const roadmap = roadmapDoc.data();
    if (!roadmap) {
      return NextResponse.json(
        { error: 'Roadmap data not found' },
        { status: 404 }
      );
    }
    
    const totalTasks = roadmap.total_tasks || 0;

    // Calculate new progress
    const newProgress = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;

    // Check for milestone celebrations
    const celebrationTriggered = [25, 50, 75, 100].includes(newProgress) && 
                                  newProgress > (currentProgress.overall_progress_percentage || 0);

    // Use set+merge so this works whether the doc was just created or already existed
    await progressRef.set({
      completed_tasks: completedTasks,
      overall_progress_percentage: newProgress,
      ghost_solidness: newProgress,
      last_activity: new Date(),
    }, { merge: true });

    return NextResponse.json({
      success: true,
      newProgress,
      celebrationTriggered,
    });
  } catch (error) {
    const apiError = handleAPIError(error);
    return NextResponse.json(
      { error: apiError.message, code: apiError.code },
      { status: apiError.statusCode }
    );
  }
}
