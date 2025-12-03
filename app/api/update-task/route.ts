import { NextRequest, NextResponse } from 'next/server';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
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

    // Get current progress
    const progressRef = doc(db, `user_progress/${userId}/repos`, repoId);
    const progressDoc = await getDoc(progressRef);

    if (!progressDoc.exists()) {
      return NextResponse.json(
        { error: 'Progress not found' },
        { status: 404 }
      );
    }

    const currentProgress = progressDoc.data();
    let completedTasks = currentProgress.completed_tasks || [];

    // Update completed tasks array
    if (completed && !completedTasks.includes(taskId)) {
      completedTasks.push(taskId);
    } else if (!completed && completedTasks.includes(taskId)) {
      completedTasks = completedTasks.filter((id: string) => id !== taskId);
    }

    // Get roadmap to calculate total tasks
    const roadmapRef = doc(db, 'roadmaps', repoId);
    const roadmapDoc = await getDoc(roadmapRef);

    if (!roadmapDoc.exists()) {
      return NextResponse.json(
        { error: 'Roadmap not found' },
        { status: 404 }
      );
    }

    const roadmap = roadmapDoc.data();
    const totalTasks = roadmap.total_tasks || 0;

    // Calculate new progress
    const newProgress = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;

    // Check for milestone celebrations
    const celebrationTriggered = [25, 50, 75, 100].includes(newProgress) && 
                                  newProgress > currentProgress.overall_progress_percentage;

    // Update progress in Firebase
    await updateDoc(progressRef, {
      completed_tasks: completedTasks,
      overall_progress_percentage: newProgress,
      ghost_solidness: newProgress,
      last_activity: new Date(),
    });

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
