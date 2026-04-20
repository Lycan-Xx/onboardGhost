'use client';

import Link from "next/link";
import { ArrowLeft, Target, Cpu, Zap, Rocket } from "lucide-react";

export default function WhyPage() {
  return (
    <div className="relative min-h-screen bg-bg text-fg">
      <div className="absolute inset-0 grid-canvas opacity-40 pointer-events-none" />

      {/* Header */}
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

      <main className="relative mx-auto max-w-4xl px-5 sm:px-8 py-16 sm:py-24">
        <div className="max-w-2xl mb-16">
          <h1 className="font-serif text-4xl sm:text-5xl mb-6">Why OnboardGhost?</h1>
          <p className="text-lg text-muted leading-relaxed">
            Every developer has felt the "blank screen" anxiety when joining a new project. 
            Navigating thousands of lines of unfamiliar code shouldn't be a test of endurance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <WhySection 
            icon={<Target className="text-accent" size={24} />}
            title="The 40-Hour Onboarding Tax"
            body="Studies show it takes an average of 40 hours for a developer to become productive in a new codebase. We aim to slash that to less than 4 hours by providing immediate, structured context."
          />
          <WhySection 
            icon={<Cpu className="text-accent" size={24} />}
            title="AI-Native Architecture"
            body="While current tools search for text, OnboardGhost reasons about architecture. We don't just find strings; we understand the relationship between your API layer, your database, and your UI."
          />
          <WhySection 
            icon={<Zap className="text-accent" size={24} />}
            title="Eliminating Context Switching"
            body="Stop jumping between Slack, Jira, and Documentation. Your roadmap and your mentor are right where your analysis is, providing a single source of truth for your onboarding journey."
          />
          <WhySection 
            icon={<Rocket className="text-accent" size={24} />}
            title="From Junior to Lead"
            body="Junior devs get a safe path to learning; Lead devs save hundreds of hours in manual mentorship. OnboardGhost creates a bridge between knowledge-havers and knowledge-seekers."
          />
        </div>

        <section className="mt-24 pt-16 border-t border-border">
          <div className="rounded-2xl bg-surface/40 border border-border p-8 sm:p-12 text-center">
            <h2 className="font-serif text-3xl mb-4">Ready to clear the fog?</h2>
            <p className="text-muted mb-8 max-w-md mx-auto">Join the developers using OnboardGhost to master new codebases with confidence.</p>
            <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-full bg-accent text-white px-8 py-3 text-sm font-medium hover:bg-accent-hover transition-colors">
              Analyze your first repo
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

function WhySection({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="space-y-4">
      <div className="w-12 h-12 rounded-xl bg-surface border border-border grid place-items-center">
        {icon}
      </div>
      <h3 className="text-xl font-medium">{title}</h3>
      <p className="text-muted text-sm leading-relaxed">{body}</p>
    </div>
  );
}
