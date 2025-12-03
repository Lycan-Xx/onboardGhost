"use client";

import { useState } from "react";
import Link from "next/link";

export default function TasksPage() {
  const [showChat, setShowChat] = useState(false);

  return (
    <div className="container mx-auto px-6 py-8">
      <header className="flex justify-between items-center mb-16">
        <div className="flex items-center gap-6">
          <Link href="/">
            <button className="flex items-center gap-2 text-text-muted-dark hover:text-primary transition-colors">
              <span className="material-symbols-outlined">arrow_back</span>
              <span>Back</span>
            </button>
          </Link>
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="material-icons-outlined text-primary text-4xl">
              ghost
            </span>
            <span className="text-2xl font-bold">OnboardGhost</span>
          </div>
        </div>
        <Link href="/profile">
          <button className="w-12 h-12 flex items-center justify-center bg-surface-dark border border-border-dark rounded-full hover:border-primary hover:shadow-neon-sm transition-all duration-300">
            <span className="material-symbols-outlined text-text-muted-dark">person</span>
          </button>
        </Link>
      </header>

      <main>
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-3">Repository: side-project-api</h1>
          <p className="text-lg text-text-muted-dark">Complete these tasks to understand the codebase</p>
        </div>

        <div className="max-w-4xl">
          <div className="space-y-6">
            {[
              { title: "Explore the project structure", completed: true },
              { title: "Review the main entry point", completed: true },
              { title: "Understand the API routes", completed: false },
              { title: "Check the database schema", completed: false },
            ].map((task, idx) => (
              <div
                key={idx}
                className="bg-surface-dark border border-border-dark rounded-lg p-6 hover:border-primary hover:shadow-neon-sm transition-all duration-300"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      task.completed
                        ? "bg-primary border-primary"
                        : "border-border-dark"
                    }`}
                  >
                    {task.completed && (
                      <span className="material-symbols-outlined text-background-dark text-sm">
                        check
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-semibold">{task.title}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={() => setShowChat(true)}
          className="fixed bottom-8 right-8 w-16 h-16 bg-primary rounded-full flex items-center justify-center hover:shadow-neon transition-all duration-300"
        >
          <span className="material-symbols-outlined text-background-dark text-3xl">
            chat
          </span>
        </button>
      </main>

      {showChat && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface-dark border border-primary rounded-lg w-full max-w-2xl h-[600px] flex flex-col shadow-neon">
            <div className="flex justify-between items-center p-6 border-b border-border-dark">
              <h2 className="text-2xl font-bold">Ghost Chat</h2>
              <button
                onClick={() => setShowChat(false)}
                className="text-text-muted-dark hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined text-3xl">close</span>
              </button>
            </div>
            <div className="flex-1 p-6 overflow-y-auto">
              <p className="text-text-muted-dark">Ask me anything about this repository...</p>
            </div>
            <div className="p-6 border-t border-border-dark">
              <input
                type="text"
                placeholder="Type your question..."
                className="w-full bg-background-dark border border-border-dark text-text-dark py-3 px-4 rounded placeholder-text-muted-dark/70 focus:ring-primary focus:border-primary focus:shadow-neon-sm transition-all duration-300"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
