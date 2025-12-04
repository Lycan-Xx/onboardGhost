import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { createGeminiClient } from '@/lib/gemini/client';
import { handleAPIError } from '@/lib/utils/errors';

// Rate limiting: 10 messages per hour per user
const RATE_LIMIT_MESSAGES = 10;
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds

async function checkRateLimit(userId: string): Promise<{ allowed: boolean; remaining: number }> {
  const oneHourAgo = new Date(Date.now() - RATE_LIMIT_WINDOW);
  
  const messagesRef = adminDb.collection('chat_history');
  const snapshot = await messagesRef
    .where('user_id', '==', userId)
    .where('timestamp', '>', oneHourAgo)
    .where('role', '==', 'user')
    .get();
  
  const messageCount = snapshot.size;
  
  return {
    allowed: messageCount < RATE_LIMIT_MESSAGES,
    remaining: Math.max(0, RATE_LIMIT_MESSAGES - messageCount)
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, repoId, userId } = body;

    // Validate inputs
    if (!message || !repoId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: message, repoId, userId' },
        { status: 400 }
      );
    }

    // Check rate limiting
    const rateLimitCheck = await checkRateLimit(userId);
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        { 
          error: `Rate limit exceeded. You can send ${RATE_LIMIT_MESSAGES} messages per hour. Please try again later.`,
          remaining: rateLimitCheck.remaining
        },
        { status: 429 }
      );
    }

    // Fetch repository data to get Gemini file URIs
    const repoRef = adminDb.collection('repositories').doc(repoId);
    const repoDoc = await repoRef.get();

    if (!repoDoc.exists) {
      return NextResponse.json(
        { error: 'Repository not found' },
        { status: 404 }
      );
    }

    const repoData = repoDoc.data();
    if (!repoData) {
      return NextResponse.json(
        { error: 'Repository data not found' },
        { status: 404 }
      );
    }
    
    const geminiFiles = repoData.gemini_files || [];

    // Save user message to chat history
    await adminDb.collection('chat_history').add({
      user_id: userId,
      repo_id: repoId,
      role: 'user',
      content: message,
      timestamp: new Date()
    });

    // Prepare project context for Gemini
    const projectContext = {
      name: repoData.name || 'Unknown Project',
      purpose: repoData.project_purpose?.purpose || 'Not specified',
      techStack: repoData.tech_stack?.languages || [],
      repositoryMetadata: repoData.repository_metadata || {},
      analysisData: {
        tech_stack: repoData.tech_stack || {},
        database: repoData.database_requirements || [],
        env_vars: repoData.environment_variables || [],
        purpose: repoData.project_purpose || {},
      }
    };

    // Call Gemini API with project context
    let assistantResponse = '';
    let fileReferences: string[] = [];

    try {
      const geminiClient = createGeminiClient();
      const conversationHistory: Array<{ role: string; content: string }> = []; // Could be loaded from chat history if needed

      assistantResponse = await geminiClient.chat(message, conversationHistory, projectContext);

      // For now, we don't extract file references from the response
      // This could be enhanced in the future with better parsing
      fileReferences = [];
    } catch (geminiError) {
      console.error('Gemini API error:', geminiError);
      assistantResponse = "I'm having trouble accessing the repository information right now. Please try again in a moment.";
    }

    // Save assistant message to chat history
    await adminDb.collection('chat_history').add({
      user_id: userId,
      repo_id: repoId,
      role: 'assistant',
      content: assistantResponse,
      file_references: fileReferences,
      timestamp: new Date()
    });

    return NextResponse.json({
      response: assistantResponse,
      file_references: fileReferences,
      remaining_messages: rateLimitCheck.remaining - 1
    });

  } catch (error) {
    const apiError = handleAPIError(error);
    return NextResponse.json(
      { error: apiError.message, code: apiError.code },
      { status: apiError.statusCode }
    );
  }
}
