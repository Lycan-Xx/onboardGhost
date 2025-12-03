import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-radial from-primary/10 via-transparent to-transparent opacity-30"></div>
      <div className="absolute inset-0 bg-gradient-radial-br from-primary/5 via-transparent to-transparent opacity-30"></div>
      <div className="absolute inset-0 grid-pattern"></div>

      <div className="relative min-h-screen flex flex-col items-center px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="w-full max-w-7xl mx-auto py-6">
          <div className="flex items-center">
            <span className="material-icons-outlined text-primary text-3xl opacity-75">
              ghost
            </span>
          </div>
        </header>

        {/* Hero Section */}
        <main className="flex-grow flex flex-col items-center justify-center text-center py-20 w-full max-w-4xl">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white">
            ONBOARD GHOST
          </h1>
          <p className="mt-4 text-lg md:text-xl font-medium text-primary">
            Stop Haunting New Developers
          </p>

          <div className="my-12">
            <span className="material-icons-outlined text-9xl text-white opacity-80 animate-float">
              ghost
            </span>
          </div>

          <h2 className="text-2xl md:text-3xl font-semibold text-white">
            Your AI guide through haunted codebases
          </h2>
          <p className="mt-4 max-w-2xl text-lg text-text-muted-dark">
            Turn weeks of confusion into days of clarity.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/dashboard">
              <button className="w-full sm:w-auto bg-primary text-white font-semibold py-3 px-8 rounded-lg shadow-lg hover:shadow-neon transition-all duration-300">
                Get Started Free →
              </button>
            </Link>
            <button className="w-full sm:w-auto bg-surface-dark/50 text-text-dark font-semibold py-3 px-8 rounded-lg hover:bg-surface-dark transition-all duration-300 border border-border-dark">
              Watch Demo (2 min)
            </button>
          </div>
        </main>

        {/* How It Works Section */}
        <section className="py-24 w-full max-w-7xl mx-auto" id="how-it-works">
          <div className="text-center mb-16">
            <h2 className="text-base font-semibold tracking-wider text-primary uppercase">
              How It Works
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            <div className="flex flex-col items-center">
              <div className="flex items-center justify-center h-16 w-16 rounded-xl bg-primary/10 mb-6 border border-primary/20">
                <span className="material-icons-outlined text-3xl text-primary">link</span>
              </div>
              <h3 className="text-xl font-semibold text-white">Connect Repo</h3>
              <p className="mt-2 text-text-muted-dark">Paste GitHub URL</p>
            </div>

            <div className="flex flex-col items-center">
              <div className="flex items-center justify-center h-16 w-16 rounded-xl bg-primary/10 mb-6 border border-primary/20">
                <span className="material-icons-outlined text-3xl text-primary">memory</span>
              </div>
              <h3 className="text-xl font-semibold text-white">AI Analyzes Code</h3>
              <p className="mt-2 text-text-muted-dark">Generates roadmap</p>
            </div>

            <div className="flex flex-col items-center">
              <div className="flex items-center justify-center h-16 w-16 rounded-xl bg-primary/10 mb-6 border border-primary/20">
                <span className="material-icons-outlined text-3xl text-primary">
                  question_answer
                </span>
              </div>
              <h3 className="text-xl font-semibold text-white">Ask Questions</h3>
              <p className="mt-2 text-text-muted-dark">Chat with mentor</p>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-24 w-full max-w-7xl mx-auto" id="testimonials">
          <div className="text-center mb-16">
            <h2 className="text-base font-semibold tracking-wider text-primary uppercase">
              Trusted By Developers
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-surface-dark/50 p-8 rounded-xl backdrop-blur-sm border border-border-dark hover:border-primary/30 transition-all duration-300">
              <p className="text-text-muted-dark">
                "Onboard Ghost is a game-changer. I got up to speed on a massive legacy codebase
                in just two days. Unbelievable!"
              </p>
              <div className="mt-6 font-semibold text-white">- Alex D, Senior Engineer</div>
            </div>

            <div className="bg-surface-dark/50 p-8 rounded-xl backdrop-blur-sm border border-border-dark hover:border-primary/30 transition-all duration-300">
              <p className="text-text-muted-dark">
                "As a new hire, the cognitive load was immense. This tool provided a clear path and
                answered my dumbest questions without judgment."
              </p>
              <div className="mt-6 font-semibold text-white">- Sarah J, Junior Developer</div>
            </div>

            <div className="bg-surface-dark/50 p-8 rounded-xl backdrop-blur-sm border border-border-dark hover:border-primary/30 transition-all duration-300">
              <p className="text-text-muted-dark">
                "We've cut our new developer onboarding time by 60%. It pays for itself in the
                first week. Highly recommend."
              </p>
              <div className="mt-6 font-semibold text-white">- Michael B, Engineering Manager</div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="w-full max-w-7xl mx-auto py-12 mt-16 border-t border-border-dark">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="material-icons-outlined text-primary text-xl opacity-75">
                ghost
              </span>
              <span className="text-text-muted-dark">Onboard Ghost</span>
            </div>
            <nav className="flex gap-6">
              <a
                className="text-text-muted-dark hover:text-primary transition-colors"
                href="#"
              >
                Pricing
              </a>
              <a
                className="text-text-muted-dark hover:text-primary transition-colors"
                href="#"
              >
                About
              </a>
              <a
                className="text-text-muted-dark hover:text-primary transition-colors"
                href="#"
              >
                Contact
              </a>
            </nav>
          </div>
        </footer>
      </div>
    </div>
  );
}
