"use client";

import { useState } from "react";
import Link from "next/link";

interface Task {
  id: number;
  title: string;
  completed: boolean;
  content: {
    description: string[];
    codeSnippets?: { language: string; code: string }[];
    commands?: string[];
  };
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: 1,
      title: "Clone repo",
      completed: true,
      content: {
        description: [
          "First, you need to clone the repository to your local machine. This creates a local copy of the project.",
          "Use the following command in your terminal:",
        ],
        commands: ["git clone https://github.com/username/studywise-ai.git"],
        description2: ["Navigate into the project directory:"],
        commands2: ["cd studywise-ai"],
      },
    },
    {
      id: 2,
      title: "Install dependencies",
      completed: true,
      content: {
        description: [
          "Install all the required packages and dependencies for the project.",
          "This project uses npm as the package manager. Run:",
        ],
        commands: ["npm install"],
        description2: [
          "This will read the package.json file and install all dependencies listed there.",
        ],
      },
    },
    {
      id: 3,
      title: "Create .env file",
      completed: false,
      content: {
        description: [
          "To create a `.env` file, start by navigating to the root directory of the project in your terminal. This file is crucial for storing environment variables securely.",
          "You can create the file using the following command:",
        ],
        commands: ["touch .env"],
        description2: [
          "Once created, open the `.env` file in your text editor and add the necessary key-value pairs. For this project, you will need to add your `DATABASE_URL` and `GITHUB_API_KEY`.",
        ],
        codeSnippets: [
          {
            language: "bash",
            code: `DATABASE_URL=postgresql://user:password@localhost:5432/dbname
GITHUB_API_KEY=your_github_api_key_here
NODE_ENV=development`,
          },
        ],
      },
    },
    {
      id: 4,
      title: "Run migrations",
      completed: false,
      content: {
        description: [
          "Database migrations help set up your database schema. This project uses Prisma for database management.",
          "Run the following command to apply all pending migrations:",
        ],
        commands: ["npx prisma migrate dev"],
        description2: [
          "This will create the necessary tables and relationships in your database based on the schema defined in the project.",
        ],
      },
    },
    {
      id: 5,
      title: "Initialize server",
      completed: false,
      content: {
        description: [
          "Finally, start the development server to run the application locally.",
          "Use this command to start the server:",
        ],
        commands: ["npm run dev"],
        description2: [
          "The server will start on http://localhost:3000. Open this URL in your browser to see the application running.",
        ],
      },
    },
  ]);

  const [selectedTaskId, setSelectedTaskId] = useState(3);
  const [chatOpen, setChatOpen] = useState(false);

  const selectedTask = tasks.find((t) => t.id === selectedTaskId);
  const completedCount = tasks.filter((t) => t.completed).length;
  const progressPercentage = Math.round((completedCount / tasks.length) * 100);

  const handleMarkComplete = () => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === selectedTaskId ? { ...task, completed: true } : task
      )
    );

    // Auto-select next incomplete task
    const nextTask = tasks.find((t) => t.id > selectedTaskId && !t.completed);
    if (nextTask) {
      setTimeout(() => setSelectedTaskId(nextTask.id), 300);
    }
  };

  return (
    <div className="min-h-screen flex flex-col p-4 sm:p-6 lg:p-8">
      <header className="w-full max-w-7xl mx-auto mb-8">
        <div className="flex justify-between items-center mb-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-text-muted-dark hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
            <span>Return to Dashboard</span>
          </Link>
          <Link
            href="/profile"
            className="flex items-center gap-2 text-text-muted-dark hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined">account_circle</span>
            <span>Profile</span>
          </Link>
        </div>

        <div className="text-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-text-dark">studywise-ai</h1>
          <p className="text-text-muted-dark text-sm">Onboarding Checklist</p>
        </div>

        <div className="w-full max-w-2xl mx-auto">
          <div className="flex items-center gap-4 w-full">
            <span className="text-sm font-medium text-primary">{progressPercentage}%</span>
            <div className="w-full bg-surface-dark rounded-full h-1.5">
              <div
                className="progress-bar-fill h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-8 items-start pb-24">
        {/* Left Panel - Task List */}
        <div className="lg:col-span-2 bg-surface-dark border border-border-dark rounded-lg p-6 space-y-3">
          {tasks.map((task) => (
            <label
              key={task.id}
              htmlFor={`task${task.id}`}
              className={`flex items-center gap-3 text-lg p-3 rounded-md transition-all duration-300 cursor-pointer ${
                task.completed
                  ? "text-text-muted-dark"
                  : "text-text-dark"
              } ${
                selectedTaskId === task.id
                  ? "bg-primary/10 ring-1 ring-primary/50"
                  : "hover:bg-border-dark/30"
              }`}
            >
              <input
                checked={selectedTaskId === task.id}
                onChange={() => setSelectedTaskId(task.id)}
                className="h-5 w-5 rounded-sm border-2 border-border-dark bg-transparent focus:ring-primary focus:ring-offset-surface-dark text-primary sr-only"
                id={`task${task.id}`}
                name="onboardingTask"
                type="radio"
              />
              <span
                className={`material-symbols-outlined !text-2xl ${
                  task.completed ? "text-primary" : "text-text-muted-dark"
                }`}
              >
                {task.completed ? "check_circle" : "radio_button_unchecked"}
              </span>
              <span className="flex-grow">{task.title}</span>
            </label>
          ))}
        </div>

        {/* Right Panel - Task Content */}
        <div className="lg:col-span-3 bg-surface-dark border border-border-dark rounded-lg p-6 flex flex-col min-h-[500px] max-h-[600px]">
          <div className="flex-grow overflow-y-auto space-y-4 text-text-muted-dark text-base pr-2">
            <h2 className="text-xl font-bold text-text-dark mb-4 sticky top-0 bg-surface-dark pb-2">
              {selectedTask?.title}
            </h2>

            {selectedTask?.content.description.map((para, idx) => (
              <p key={idx}>{para}</p>
            ))}

            {selectedTask?.content.commands?.map((cmd, idx) => (
              <pre
                key={idx}
                className="bg-background-dark p-4 rounded-md text-sm text-primary border border-border-dark font-mono"
              >
                <code>{cmd}</code>
              </pre>
            ))}

            {(selectedTask?.content as any).description2?.map((para: string, idx: number) => (
              <p key={`desc2-${idx}`}>{para}</p>
            ))}

            {(selectedTask?.content as any).commands2?.map((cmd: string, idx: number) => (
              <pre
                key={`cmd2-${idx}`}
                className="bg-background-dark p-4 rounded-md text-sm text-primary border border-border-dark font-mono"
              >
                <code>{cmd}</code>
              </pre>
            ))}

            {selectedTask?.content.codeSnippets?.map((snippet, idx) => (
              <pre
                key={idx}
                className="bg-background-dark p-4 rounded-md text-sm text-text-dark border border-border-dark font-mono overflow-x-auto"
              >
                <code>{snippet.code}</code>
              </pre>
            ))}
          </div>

          <div className="flex justify-end mt-6 pt-4 border-t border-border-dark">
            <button
              onClick={handleMarkComplete}
              disabled={selectedTask?.completed}
              className={`px-6 py-2 font-bold rounded-md transition-all duration-300 flex items-center gap-2 ${
                selectedTask?.completed
                  ? "bg-border-dark text-text-muted-dark cursor-not-allowed"
                  : "bg-primary text-background-dark hover:shadow-neon focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-surface-dark"
              }`}
            >
              {selectedTask?.completed ? "Completed" : "Mark as Complete"}
              <span className="material-symbols-outlined">
                {selectedTask?.completed ? "check" : "arrow_forward"}
              </span>
            </button>
          </div>
        </div>
      </main>

      {/* Chat Button & Overlay */}
      <footer className="fixed bottom-0 left-0 right-0 flex justify-center pointer-events-none z-50">
        <div className="w-full max-w-3xl pointer-events-auto">
          {!chatOpen && (
            <div className="flex justify-center transition-all duration-300">
              <button
                onClick={() => setChatOpen(true)}
                className="mb-4 flex items-center gap-2 px-5 py-2.5 bg-surface-dark border border-border-dark rounded-lg text-text-dark font-semibold hover:border-primary hover:text-primary hover:shadow-neon-sm transition-all shadow-lg"
              >
                <span className="material-symbols-outlined text-primary text-xl">psychology</span>
                Ask Ghost Mentor AI
              </button>
            </div>
          )}

          {chatOpen && (
            <div className="h-[70vh] max-h-[600px] bg-surface-dark/95 backdrop-blur-xl border-t-2 border-x-2 border-primary rounded-t-lg shadow-neon flex flex-col transition-all duration-300">
              <header className="flex justify-between items-center p-4 border-b border-border-dark flex-shrink-0">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">psychology</span>
                  Ghost Mentor AI
                </h2>
                <button
                  onClick={() => setChatOpen(false)}
                  className="p-1 rounded-full text-text-muted-dark hover:bg-border-dark hover:text-text-dark transition-colors"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </header>

              <div className="flex-grow p-4 sm:p-6 overflow-y-auto space-y-6">
                <div className="flex justify-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex-shrink-0 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-lg">
                      psychology
                    </span>
                  </div>
                  <div className="bg-border-dark/50 p-3 rounded-lg max-w-md">
                    <p className="text-text-dark">
                      Hello! I see you're working on the `{selectedTask?.title}` task. Do you have
                      any questions?
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <div className="bg-primary/90 text-background-dark p-3 rounded-lg max-w-md">
                    <p>Yes, I need some help with this step.</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-border-dark flex-shrink-0 flex items-center justify-center">
                    <span className="material-symbols-outlined text-text-muted-dark text-lg">
                      person
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-border-dark">
                <div className="relative">
                  <input
                    className="w-full bg-background-dark border border-border-dark rounded-md py-2.5 pl-4 pr-12 focus:ring-2 focus:ring-primary focus:border-primary text-text-dark placeholder:text-text-muted-dark"
                    placeholder="Ask a question..."
                    type="text"
                  />
                  <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md text-primary hover:bg-primary/20 transition-colors">
                    <span className="material-symbols-outlined">send</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}
