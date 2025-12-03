"use client";

import Link from "next/link";

export default function ProfilePage() {
  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-text-muted-dark hover:text-primary transition-colors"
          >
            <span className="material-icons-outlined" style={{ fontSize: "1.25rem" }}>
              arrow_back
            </span>
            Back
          </Link>
          <h1 className="text-3xl font-bold mt-4">Profile &amp; Settings</h1>
        </header>

        <main className="space-y-12">
          {/* Account Section */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted-dark mb-4">
              Account
            </h2>
            <div className="bg-surface-dark p-6 rounded-lg border border-border-dark space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <p>
                  <span className="text-text-muted-dark">Email:</span> john@example.com
                </p>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-text-muted-dark">GitHub:</span>
                  <span className="flex items-center gap-1 text-green-500">
                    <span className="material-icons-outlined" style={{ fontSize: "1.25rem" }}>
                      check_circle
                    </span>
                    @johndev
                  </span>
                </div>
                <button className="mt-2 sm:mt-0 text-sm font-medium text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-surface-dark rounded-sm self-start sm:self-center">
                  Disconnect
                </button>
              </div>
            </div>
          </section>

          {/* Preferences Section */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted-dark mb-4">
              Preferences
            </h2>
            <div className="bg-surface-dark p-6 rounded-lg border border-border-dark space-y-6">
              <div>
                <label className="block text-sm font-medium text-text-dark mb-3">
                  Ghost Personality
                </label>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      className="h-4 w-4 text-primary border-border-dark bg-background-dark focus:ring-primary"
                      id="formal"
                      name="personality"
                      type="radio"
                    />
                    <label className="ml-3 block text-sm" htmlFor="formal">
                      Formal &amp; Professional
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      defaultChecked
                      className="h-4 w-4 text-primary border-border-dark bg-background-dark focus:ring-primary"
                      id="friendly"
                      name="personality"
                      type="radio"
                    />
                    <label className="ml-3 block text-sm" htmlFor="friendly">
                      Friendly &amp; Encouraging{" "}
                      <span className="text-xs text-text-muted-dark">(Default)</span>
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      className="h-4 w-4 text-primary border-border-dark bg-background-dark focus:ring-primary"
                      id="sarcastic"
                      name="personality"
                      type="radio"
                    />
                    <label className="ml-3 block text-sm" htmlFor="sarcastic">
                      Sarcastic &amp; Witty
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label
                  className="block text-sm font-medium text-text-dark mb-2"
                  htmlFor="theme"
                >
                  Code Snippet Theme
                </label>
                <div className="relative">
                  <select
                    className="w-full sm:w-64 appearance-none block bg-background-dark border border-border-dark rounded-md py-2 pl-3 pr-10 text-base focus:outline-none focus:ring-primary focus:border-primary focus:shadow-neon-sm transition-all duration-300"
                    id="theme"
                    name="theme"
                  >
                    <option>VS Code Dark</option>
                    <option>Monokai</option>
                    <option>Solarized Light</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-dark">
                    <span className="material-icons-outlined">expand_more</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Danger Zone Section */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-red-500 mb-4">
              Danger Zone
            </h2>
            <div className="bg-surface-dark p-6 rounded-lg border border-red-500 space-y-4">
              <p className="text-sm text-text-muted-dark">
                These actions are irreversible. Please be certain.
              </p>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <button className="w-full sm:w-auto px-4 py-2 border border-red-500 text-red-500 text-sm font-medium rounded-md hover:bg-red-500/10 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-surface-dark transition-colors">
                  Delete All Data
                </button>
                <button className="w-full sm:w-auto px-4 py-2 bg-red-500 border border-transparent text-white text-sm font-medium rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-surface-dark transition-colors">
                  Delete Account
                </button>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
