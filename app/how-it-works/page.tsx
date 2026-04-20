'use client';

import Link from "next/link";
import { ArrowLeft, Search, Cpu, ListChecks, MessageSquare, Database, ShieldCheck } from "lucide-react";

export default function HowItWorksPage() {
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
          <h1 className="font-serif text-4xl sm:text-5xl mb-6">How it Works</h1>
          <p className="text-lg text-muted leading-relaxed">
            OnboardGhost uses a sophisticated pipeline of static analysis, large language models, 
            and vector retrieval to build a comprehensive map of any codebase in seconds.
          </p>
        </div>

        <div className="space-y-20">
          <ProcessStep 
            number="01"
            icon={<Search size={24} className="text-accent" />}
            title="Repository Analysis"
            body="We fetch your repository using the GitHub API. Our system analyzes the file tree and extracts critical metadata—dependencies, configuration files, and README documentation—to understand the project's skeleton."
          />
          
          <ProcessStep 
            number="02"
            icon={<Cpu size={24} className="text-accent" />}
            title="AI Reasoning with Gemini"
            body="The raw data is processed by Google Gemini Pro. It identifies the tech stack, determines the project purpose, and detects database or third-party service requirements. It essentially 'reads' the project for you."
          />

          <ProcessStep 
            number="03"
            icon={<ListChecks size={24} className="text-accent" />}
            title="Dynamic Roadmap Generation"
            body="Based on the analysis, we generate a structured onboarding roadmap. This isn't a generic template; it's a tailormade sequence of tasks ranging from environment setup to making your first feature contribution."
          />

          <ProcessStep 
            number="04"
            icon={<MessageSquare size={24} className="text-accent" />}
            title="The Ghost Mentor (RAG)"
            body="We use Retrieval-Augmented Generation (RAG) to power our mentor. Critical code snippets are embedded and stored in Upstash Vector. When you ask a question, the mentor retrieves the exact code context needed to give an accurate answer."
          />

          <ProcessStep 
            number="05"
            icon={<Database size={24} className="text-accent" />}
            title="Persistent Progress"
            body="Every task you complete and every analysis you run is stored securely in Firebase. This allows you to pick up exactly where you left off across any device, building a permanent record of your codebase knowledge."
          />
        </div>

        <section className="mt-32 pt-16 border-t border-border">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-8 rounded-2xl bg-surface/30 border border-border">
              <ShieldCheck className="text-accent mb-4" size={28} />
              <h3 className="text-xl font-medium mb-3">Privacy First</h3>
              <p className="text-sm text-muted leading-relaxed">
                We never store your entire source code permanently. We only analyze what's necessary to build your roadmap and mentor, using secure vector embeddings for reasoning.
              </p>
            </div>
            <div className="p-8 rounded-2xl bg-surface/30 border border-border flex flex-col justify-center">
              <h3 className="text-xl font-medium mb-3">Ready to see the code?</h3>
              <p className="text-sm text-muted mb-6">Experience the analysis engine for yourself.</p>
              <Link href="/dashboard" className="inline-flex items-center gap-2 text-accent font-medium hover:underline">
                Start an analysis <ArrowLeft size={14} className="rotate-180" />
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function ProcessStep({ number, icon, title, body }: { number: string; icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="flex gap-6 sm:gap-10">
      <div className="flex flex-col items-center">
        <div className="w-12 h-12 rounded-full border border-accent/30 bg-accent/5 grid place-items-center shrink-0">
          {icon}
        </div>
        <div className="flex-1 w-px bg-gradient-to-b from-accent/30 to-transparent mt-4" />
      </div>
      <div>
        <span className="font-serif text-sm text-accent/60 uppercase tracking-widest block mb-2">{number}</span>
        <h3 className="text-2xl font-medium mb-4">{title}</h3>
        <p className="text-muted leading-relaxed max-w-2xl">{body}</p>
      </div>
    </div>
  );
}
