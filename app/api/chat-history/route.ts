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

    // Fetch chat history from Firebase
    const chatRef = adminDb.collection('chat_history');
    const snapshot = await chatRef
      .where('user_id', '==', userId)
      .where('repo_id', '==', repoId)
      .orderBy('timestamp', 'asc')
      .get();

    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp.toDate()
    }));

    return NextResponse.json({ messages });

  } catch (error) {
    const apiError = handleAPIError(error);
    return NextResponse.json(
      { error: apiError.message, code: apiError.code },
      { status: apiError.statusCode }
    );
  }
}
