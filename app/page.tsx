'use client';

import Link from "next/link";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();
  const [repoUrl, setRepoUrl] = useState("");

  const handleAnalyze = () => {
    // Route to dashboard with prefilled repo (dashboard handles auth gate)
    if (repoUrl.trim()) {
      router.push(`/dashboard?prefill=${encodeURIComponent(repoUrl.trim())}`);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="relative min-h-screen bg-bg text-fg overflow-hidden">
      <div className="absolute inset-0 grid-canvas opacity-60" />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_50%_100%,rgba(242,84,91,0.10),transparent_60%)]" />

      <div className="relative z-10 flex min-h-screen flex-col">
        {/* Header */}
        <header className="w-full">
          <div className="mx-auto max-w-6xl px-5 sm:px-8 py-5 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-md bg-accent/20 border border-accent/30 grid place-items-center">
                <span className="text-accent text-sm font-semibold">◈</span>
              </div>
              <span className="font-semibold tracking-tight">OnboardGhost</span>
            </Link>
            <nav className="hidden md:flex items-center gap-7 text-sm text-muted">
              <Link href="/how-it-works" className="hover:text-fg transition-colors">How it works</Link>
              <Link href="/why" className="hover:text-fg transition-colors">Why</Link>
              <Link href="/dashboard" className="hover:text-fg transition-colors">Sign in</Link>
            </nav>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-full bg-fg text-bg px-4 py-2 text-sm font-medium hover:bg-white/90 transition-colors"
            >
              Get started <ArrowRight size={14} />
            </Link>
          </div>
        </header>

        {/* Hero */}
        <main className="flex-1 flex flex-col items-center text-center px-5 sm:px-8 pt-16 sm:pt-24 pb-32">
          <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted mb-8">
            <span className="h-1 w-1 rounded-full bg-accent" /> AI codebase onboarding
          </span>

          <h1 className="font-serif text-[clamp(2.4rem,6vw,4.5rem)] leading-[1.05] tracking-tight max-w-4xl">
            Onboard any codebase
            <br />
            <span className="italic text-accent">in days, not weeks.</span>
          </h1>

          <p className="mt-6 max-w-xl text-base sm:text-lg text-muted leading-relaxed">
            Paste a GitHub repository. Get a personalized roadmap, an AI mentor,
            and a clear path from <em>zero</em> to first commit.
          </p>

          {/* Hero input */}
          <div className="mt-10 w-full max-w-xl">
            <div className="flex items-center gap-2 rounded-full bg-surface border border-border-strong p-1.5 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.6)]">
              <input
                type="text"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
                placeholder="Paste a GitHub repo URL…"
                className="flex-1 bg-transparent px-4 py-2.5 text-sm text-fg placeholder:text-subtle outline-none"
              />
              <button
                onClick={handleAnalyze}
                className="inline-flex items-center gap-2 rounded-full bg-accent text-white px-5 py-2.5 text-sm font-medium hover:bg-accent-hover transition-colors whitespace-nowrap"
              >
                Analyze <ArrowRight size={14} />
              </button>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-muted">
              <span>Try:</span>
              {[
                { label: "facebook/react", url: "https://github.com/facebook/react" },
                { label: "vercel/next.js", url: "https://github.com/vercel/next.js" },
                { label: "reduxjs/redux", url: "https://github.com/reduxjs/redux" },
              ].map((d) => (
                <button
                  key={d.label}
                  onClick={() => setRepoUrl(d.url)}
                  className="rounded-full border border-border px-3 py-1 hover:border-accent/60 hover:text-fg transition-colors"
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </main>

        {/* How it works */}
        <section id="how" className="border-t border-border bg-surface/30">
          <div className="mx-auto max-w-5xl px-5 sm:px-8 py-20">
            <p className="text-xs uppercase tracking-[0.18em] text-muted mb-10">How it works</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {[
                { n: "01", title: "Connect a repo", body: "Paste a public URL or sign in with GitHub for private access." },
                { n: "02", title: "AI maps the codebase", body: "Architecture, dependencies, and risks in ~30 seconds." },
                { n: "03", title: "Follow the roadmap", body: "Step-by-step tasks with an AI mentor that knows your code." },
              ].map((s) => (
                <div key={s.n} className="flex flex-col gap-3">
                  <span className="font-serif text-3xl text-accent/80">{s.n}</span>
                  <h3 className="font-medium text-lg">{s.title}</h3>
                  <p className="text-sm text-muted leading-relaxed">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border">
          <div className="mx-auto max-w-6xl px-5 sm:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted">
            <span>© {new Date().getFullYear()} OnboardGhost</span>
            <div className="flex items-center gap-5">
              <Link href="/privacy" className="hover:text-fg transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-fg transition-colors">Terms</Link>
              <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-fg transition-colors">
                GitHub
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
