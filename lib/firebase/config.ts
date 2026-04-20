import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// During Next.js static prerender (e.g. /_not-found) env vars may be absent.
// Avoid throwing — supply a placeholder so initializeApp doesn't crash the build.
// At runtime in the browser, the real env vars are present.
const safeConfig = {
  ...firebaseConfig,
  apiKey: firebaseConfig.apiKey || 'build-time-placeholder',
  authDomain: firebaseConfig.authDomain || 'placeholder.firebaseapp.com',
  projectId: firebaseConfig.projectId || 'placeholder',
  appId: firebaseConfig.appId || '1:000000000000:web:0000000000000000000000',
};

if (typeof window !== 'undefined') {
  const required = ['apiKey', 'authDomain', 'projectId', 'appId'] as const;
  const missing = required.filter((f) => !firebaseConfig[f]);
  if (missing.length > 0) {
    console.warn('[Firebase] Missing config fields at runtime:', missing);
  }
}

let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(safeConfig);
} else {
  app = getApps()[0];
}

const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };
