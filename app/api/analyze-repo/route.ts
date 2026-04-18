import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { validateGitHubUrl } from '@/lib/utils/url';
import { handleAPIError } from '@/lib/utils/errors';
import { inngest } from '@/lib/inngest/client';



export async function POST(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(7);
  console.log(`\n${'#'.repeat(80)}`);
  console.log(`📥 NEW ANALYSIS REQUEST [${requestId}]`);
  console.log(`${'#'.repeat(80)}\n`);
  
  try {
    const body = await request.json();
    const { repoUrl, userId, githubToken, saveProgress = true } = body;
    
    console.log(`[API ${requestId}] Repository URL: ${repoUrl}`);
    console.log(`[API ${requestId}] User ID: ${userId || 'anonymous'}`);
    console.log(`[API ${requestId}] Has GitHub Token: ${!!githubToken}`);
    console.log(`[API ${requestId}] Save Progress: ${saveProgress}\n`);

    // Validate inputs
    if (!repoUrl || !validateGitHubUrl(repoUrl)) {
      console.log(`[API ${requestId}] ❌ Invalid URL format\n`);
      return NextResponse.json(
        { error: 'Invalid GitHub repository URL' },
        { status: 400 }
      );
    }

    // userId is optional for unauthenticated users (cache-only mode)
    if (saveProgress && !userId) {
      return NextResponse.json(
        { error: 'User ID is required to save progress' },
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

    // Initialize progress document
    const progressRef = adminDb.collection('analysis_progress').doc(repoId);
    await progressRef.set({
      current_step: 0,
      step_name: 'Initializing background job...',
      step_status: 'in-progress',
      logs: [],
      updated_at: new Date(),
    });

    // Fire background job to Inngest
    console.log(`[API ${requestId}] 🚀 Dispatching Inngest background job...\n`);
    await inngest.send({
      name: "repo/analyze",
      data: {
        repoUrl,
        userId,
        githubToken,
        saveProgress,
        repoId
      }
    });

    console.log(`\n[API ${requestId}] ✅ Analysis job dispatched successfully!`);
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
