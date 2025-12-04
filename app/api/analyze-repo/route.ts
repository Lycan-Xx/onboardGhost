import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { createAnalyzer } from '@/lib/pipeline';
import { validateGitHubUrl } from '@/lib/utils/url';
import { handleAPIError } from '@/lib/utils/errors';

// Helper function to remove undefined values from objects
function removeUndefined(obj: any): any {
  if (obj === null || obj === undefined) {
    return null;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => removeUndefined(item)).filter(item => item !== undefined);
  }
  
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const key in obj) {
      const value = removeUndefined(obj[key]);
      if (value !== undefined) {
        cleaned[key] = value;
      }
    }
    return cleaned;
  }
  
  return obj;
}

export async function POST(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(7);
  console.log(`\n${'#'.repeat(80)}`);
  console.log(`📥 NEW ANALYSIS REQUEST [${requestId}]`);
  console.log(`${'#'.repeat(80)}\n`);
  
  try {
    const body = await request.json();
    const { repoUrl, userId, githubToken } = body;
    
    console.log(`[API ${requestId}] Repository URL: ${repoUrl}`);
    console.log(`[API ${requestId}] User ID: ${userId}`);
    console.log(`[API ${requestId}] Has GitHub Token: ${!!githubToken}\n`);

    // Validate inputs
    if (!repoUrl || !validateGitHubUrl(repoUrl)) {
      console.log(`[API ${requestId}] ❌ Invalid URL format\n`);
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
    console.log(`[API ${requestId}] Repository ID: ${repoId}`);

    // Check cache (30 days)
    console.log(`[API ${requestId}] 🔍 Checking cache...`);
    const repoRef = adminDb.collection('repositories').doc(repoId);
    
    try {
      const cachedRepo = await repoRef.get();

      if (cachedRepo.exists) {
        const data = cachedRepo.data();
        const analyzedAt = data?.analyzed_at?.toDate();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        if (analyzedAt && analyzedAt > thirtyDaysAgo) {
          // Check if roadmap exists
          const roadmapRef = adminDb.collection('roadmaps').doc(repoId);
          const roadmapDoc = await roadmapRef.get();
          
          if (roadmapDoc.exists) {
            // Return cached result
            console.log(`[API ${requestId}] ✅ Cache HIT - Using cached analysis from ${analyzedAt.toISOString()}\n`);
            return NextResponse.json({
              success: true,
              repoId,
              message: 'Using cached analysis',
              cached: true,
            });
          } else {
            console.log(`[API ${requestId}] ⚠️  Cache exists but roadmap missing - Re-analyzing`);
          }
        } else {
          console.log(`[API ${requestId}] ⚠️  Cache EXPIRED - Re-analyzing`);
        }
      } else {
        console.log(`[API ${requestId}] ℹ️  Cache MISS - First time analysis`);
      }
    } catch (cacheError) {
      // If cache check fails, continue with fresh analysis
      console.log(`[API ${requestId}] ⚠️  Cache check failed, proceeding with fresh analysis:`, cacheError);
    }

    // Create analyzer with progress callback
    console.log(`[API ${requestId}] 🚀 Starting fresh analysis...\n`);
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
    console.log(`[API ${requestId}] 💾 Storing results in Firestore...`);
    const repoData = removeUndefined({
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
    await repoRef.set(repoData);

    // Store roadmap
    const roadmapRef = adminDb.collection('roadmaps').doc(repoId);
    console.log(`[API ${requestId}] Storing roadmap with ${analysis.roadmap.sections?.length || 0} sections`);
    console.log(`[API ${requestId}] Total tasks: ${analysis.roadmap.total_tasks}`);
    
    const roadmapData = removeUndefined({
      ...analysis.roadmap,
      generated_at: new Date(),
    });
    await roadmapRef.set(roadmapData);

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

    console.log(`\n[API ${requestId}] ✅ Analysis completed successfully!`);
    console.log(`${'#'.repeat(80)}\n`);
    
    return NextResponse.json({
      success: true,
      repoId,
      message: 'Analysis completed successfully',
      cached: false,
    });
  } catch (error) {
    console.log(`\n[API ${requestId}] ❌ Analysis failed:`, error);
    console.log(`${'#'.repeat(80)}\n`);
    
    const apiError = handleAPIError(error);
    return NextResponse.json(
      { error: apiError.message, code: apiError.code },
      { status: apiError.statusCode }
    );
  }
}
