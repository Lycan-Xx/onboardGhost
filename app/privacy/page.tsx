'use client';

import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="relative min-h-screen bg-bg text-fg">
      <div className="absolute inset-0 grid-canvas opacity-40 pointer-events-none" />

      <header className="border-b border-border bg-bg/80 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto max-w-6xl px-5 sm:px-8 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-accent/20 border border-accent/30 grid place-items-center">
              <span className="text-accent text-sm font-semibold">◈</span>
            </div>
            <span className="font-semibold tracking-tight">OnboardGhost</span>
          </Link>
          <Link href="/" className="text-sm text-muted hover:text-fg transition-colors flex items-center gap-1.5">
            <ArrowLeft size={14} /> Back to home
          </Link>
        </div>
      </header>

      <main className="relative mx-auto max-w-3xl px-5 sm:px-8 py-16 sm:py-24">
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 text-accent bg-accent/10 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-6">
            <Shield size={14} /> Privacy Policy
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl mb-4">Your Privacy Matters</h1>
          <p className="text-muted">Last updated: April 20, 2026</p>
        </div>

        <div className="prose prose-invert max-w-none space-y-10">
          <section>
            <h2 className="text-2xl font-serif text-fg mb-4">1. Information We Collect</h2>
            <p className="text-muted leading-relaxed">
              To provide our repository analysis service, we collect limited information including your 
              GitHub username, avatar, and repository metadata. For private repositories, we temporarily 
              access files you authorize to generate roadmaps.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif text-fg mb-4">2. How We Use Your Code</h2>
            <p className="text-muted leading-relaxed">
              We do NOT store your entire source code permanently. We use Google Gemini AI to analyze 
              your code structure. Small snippets of your code are transformed into mathematical 
              representations (vector embeddings) and stored in Upstash Vector to power the "Ghost Mentor" 
              feature. This data is only accessible to you.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif text-fg mb-4">3. Data Storage</h2>
            <p className="text-muted leading-relaxed">
              Your onboarding progress, completed tasks, and generated roadmaps are stored securely 
              in Firebase Firestore. We use standard encryption and security practices to protect 
              your data.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif text-fg mb-4">4. Third Parties</h2>
            <p className="text-muted leading-relaxed">
              We use trusted services to provide OnboardGhost, including:
            </p>
            <ul className="list-disc pl-5 text-muted space-y-2 mt-4">
              <li><strong>Google:</strong> Firebase Authentication and Firestore DB.</li>
              <li><strong>GitHub:</strong> OAuth and Repository API.</li>
              <li><strong>Upstash:</strong> Vector Database for Mentor reasoning.</li>
              <li><strong>Inngest:</strong> Background job processing.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-serif text-fg mb-4">5. Your Rights</h2>
            <p className="text-muted leading-relaxed">
              You can delete your account and all associated repository analysis data at any time through 
              your Profile page.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
