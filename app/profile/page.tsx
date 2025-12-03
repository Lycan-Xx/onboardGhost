import Link from "next/link";

export default function ProfilePage() {
  return (
    <div className="container mx-auto px-6 py-8">
      <header className="flex items-center gap-6 mb-16">
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
      </header>

      <main className="max-w-2xl">
        <h1 className="text-4xl font-bold mb-8">Profile</h1>
        
        <div className="bg-surface-dark border border-border-dark rounded-lg p-8">
          <div className="flex items-center gap-6 mb-8">
            <div className="w-24 h-24 bg-primary/20 border-2 border-primary rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-5xl">person</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">User Name</h2>
              <p className="text-text-muted-dark">user@example.com</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">GitHub Username</label>
              <input
                type="text"
                placeholder="Enter your GitHub username"
                className="w-full bg-background-dark border border-border-dark text-text-dark py-3 px-4 rounded placeholder-text-muted-dark/70 focus:ring-primary focus:border-primary focus:shadow-neon-sm transition-all duration-300"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Repositories Analyzed</label>
              <p className="text-3xl font-bold text-primary">12</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
