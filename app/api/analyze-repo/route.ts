import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { createAnalyzer } from '@/lib/pipeline';
import { validateGitHubUrl } from '@/lib/utils/url';
import { handleAPIError } from '@/lib/utils/errors';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { repoUrl, userId, githubToken } = body;

    // Validate inputs
    if (!repoUrl || !validateGitHubUrl(repoUrl)) {
      return NextResponse.json(
        { error: 'Invalid GitHub repository URL' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Generate repo ID from URL
    const repoId = repoUrl.replace('https://github.com/', '').replace('/', '-');

    // Check cache (30 days)
    const repoRef = adminDb.collection('repositories').doc(repoId);
    
    try {
      const cachedRepo = await repoRef.get();

      if (cachedRepo.exists) {
        const data = cachedRepo.data();
        const analyzedAt = data?.analyzed_at?.toDate();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        if (analyzedAt && analyzedAt > thirtyDaysAgo) {
          // Return cached result
          return NextResponse.json({
            success: true,
            repoId,
            message: 'Using cached analysis',
            cached: true,
          });
        }
      }
    } catch (cacheError) {
      // If cache check fails, continue with fresh analysis
      console.log('[API] Cache check failed, proceeding with fresh analysis:', cacheError);
    }

    // Create analyzer with progress callback
    const analyzer = createAnalyzer(githubToken, async (progress) => {
      // Store progress in Firestore for real-time updates
      const progressRef = adminDb.collection('analysis_progress').doc(repoId);
      const logEntry: any = {
        timestamp: new Date(),
        step: progress.step,
        message: progress.message,
      };
      
      // Only add details if it's defined
      if (progress.details !== undefined) {
        logEntry.details = progress.details;
      }
      
      await progressRef.set({
        current_step: progress.step,
        step_name: progress.stepName,
        step_status: progress.status,
        logs: [logEntry],
        updated_at: new Date(),
      }, { merge: true });
    });

    // Run analysis
    const analysis = await analyzer.analyze(repoUrl);

    // Store results in Firestore
    await repoRef.set({
      ...analysis.repository,
      tech_stack: analysis.tech_stack,
      database_requirements: analysis.database,
      environment_variables: analysis.environment_variables,
      security_issues: analysis.security_issues,
      project_purpose: analysis.project_purpose,
      gemini_file_uris: analysis.uploaded_files.gemini_uris,
      analysis_duration: analysis.analysis_metadata.analysis_duration_seconds,
      analyzed_at: new Date(),
    });

    // Store roadmap
    const roadmapRef = adminDb.collection('roadmaps').doc(repoId);
    await roadmapRef.set({
      ...analysis.roadmap,
      generated_at: new Date(),
    });

    // Initialize user progress
    const progressRef = adminDb.collection('user_progress').doc(userId).collection('repos').doc(repoId);
    await progressRef.set({
      user_id: userId,
      repo_id: repoId,
      completed_tasks: [],
      overall_progress_percentage: 0,
      ghost_solidness: 0,
      started_at: new Date(),
      last_activity: new Date(),
    });

    return NextResponse.json({
      success: true,
      repoId,
      message: 'Analysis completed successfully',
      cached: false,
    });
  } catch (error) {
    const apiError = handleAPIError(error);
    return NextResponse.json(
      { error: apiError.message, code: apiError.code },
      { status: apiError.statusCode }
    );
  }
}
