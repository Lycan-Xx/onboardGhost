"use client";

import { useState } from "react";
import Link from "next/link";

export default function Dashboard() {
  const [selectedRepo, setSelectedRepo] = useState("");
  const [repoUrl, setRepoUrl] = useState("");

  const recentRepos = [
    { name: "side-project-api", progress: 40 },
    { name: "my-test-app", progress: 30 },
    { name: "studywise-ai", progress: 80 },
  ];

  return (
    <div className="container mx-auto px-6 py-8">
      <header className="flex justify-between items-center mb-16">
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className="material-icons-outlined text-primary text-4xl">
            ghost
          </span>
          <span className="text-2xl font-bold">OnboardGhost</span>
        </div>
        <Link href="/profile">
          <button className="w-12 h-12 flex items-center justify-center bg-surface-dark border border-border-dark rounded-full hover:border-primary hover:shadow-neon-sm transition-all duration-300">
            <span className="material-symbols-outlined text-text-muted-dark">person</span>
          </button>
        </Link>
      </header>

      <main>
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-3">Welcome Back</h1>
          <p className="text-lg text-text-muted-dark">Select a repository to get started</p>
        </div>

        <div className="max-w-4xl mx-auto mb-20">
          <div className="flex flex-col md:flex-row items-center justify-center gap-6">
            <div className="w-full md:w-auto flex-shrink-0">
              <select
                value={selectedRepo}
                onChange={(e) => setSelectedRepo(e.target.value)}
                className="w-full md:w-72 bg-surface-dark border border-border-dark text-text-muted-dark py-3 px-4 rounded focus:ring-primary focus:border-primary focus:shadow-neon-sm transition-all duration-300"
              >
                <option value="">Choose from your repositories</option>
                <option value="side-project-api">side-project-api</option>
                <option value="my-test-app">my-test-app</option>
                <option value="studywise-ai">studywise-ai</option>
              </select>
            </div>

            <div className="flex items-center gap-4 text-text-muted-dark w-full md:w-auto">
              <div className="flex-grow border-t border-border-dark"></div>
              <span className="flex-shrink-0">OR</span>
              <div className="flex-grow border-t border-border-dark"></div>
            </div>

            <div className="flex w-full md:w-auto md:flex-grow items-center gap-4">
              <input
                type="text"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                className="flex-grow bg-surface-dark border border-border-dark text-text-dark py-3 px-4 rounded placeholder-text-muted-dark/70 focus:ring-primary focus:border-primary focus:shadow-neon-sm transition-all duration-300"
                placeholder="Paste a public repository link"
              />
              <Link href="/loading">
                <button className="px-6 py-3 bg-primary text-background-dark rounded font-semibold hover:shadow-neon transition-shadow duration-300 flex-shrink-0">
                  Analyze
                </button>
              </Link>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-8">Recent Analyses</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {recentRepos.map((repo) => (
              <div
                key={repo.name}
                className="bg-surface-dark border border-border-dark rounded-lg p-6 flex flex-col justify-between hover:border-primary hover:shadow-neon-sm transition-all duration-300"
              >
                <div>
                  <h3 className="text-xl font-bold mb-4 text-text-dark">{repo.name}</h3>
                  <div className="w-full progress-bar-bg rounded-full h-2.5 mb-2">
                    <div
                      className="progress-bar-fill h-2.5 rounded-full"
                      style={{ width: `${repo.progress}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-right text-text-muted-dark mb-6">{repo.progress}% complete</p>
                </div>
                <Link href="/tasks">
                  <button className="self-start px-5 py-2.5 bg-primary/20 text-primary border border-primary/30 rounded font-semibold hover:bg-primary/30 hover:shadow-neon-sm transition-all duration-300">
                    Continue
                  </button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
