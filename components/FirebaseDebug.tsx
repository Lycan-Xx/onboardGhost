'use client';

import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase/config';

export default function FirebaseDebug() {
  const [config, setConfig] = useState<any>(null);
  const [authState, setAuthState] = useState<string>('checking...');

  useEffect(() => {
    // Check if Firebase is initialized
    if (auth) {
      setAuthState('Firebase Auth initialized ✅');
      setConfig({
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? '✅ Set' : '❌ Missing',
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? '✅ Set' : '❌ Missing',
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? '✅ Set' : '❌ Missing',
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ? '✅ Set' : '❌ Missing',
      });
    } else {
      setAuthState('Firebase Auth NOT initialized ❌');
    }
  }, []);

  if (process.env.NODE_ENV === 'production') {
    return null; // Don't show in production
  }

  return (
    <div className="fixed bottom-4 left-4 bg-gray-900 border border-gray-700 rounded-lg p-4 text-xs font-mono max-w-xs z-50">
      <div className="text-pink-400 font-bold mb-2">Firebase Debug</div>
      <div className="space-y-1 text-gray-300">
        <div>{authState}</div>
        {config && (
          <>
            <div className="mt-2 text-gray-500">Environment Variables:</div>
            {Object.entries(config).map(([key, value]) => (
              <div key={key}>
                {key}: {value as string}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
