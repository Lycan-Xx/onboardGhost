"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoadingPage() {
  const router = useRouter();
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { label: "Cloning repository", status: "completed" },
    { label: "Parsing file structure", status: "completed" },
    { label: "Analyzing dependencies", status: "in-progress" },
    { label: "Scanning for security vulnerabilities", status: "pending" },
    { label: "Generating report", status: "pending" },
  ];

  useEffect(() => {
    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressTimer);
          router.push("/tasks");
          return 100;
        }
        return prev + 1;
      });
    }, 50);

    const stepTimer = setInterval(() => {
      setCurrentStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 1000);

    return () => {
      clearInterval(progressTimer);
      clearInterval(stepTimer);
    };
  }, [router]);

  const getStepStatus = (index: number) => {
    if (index < currentStep) return "completed";
    if (index === currentStep) return "in-progress";
    return "pending";
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-x-hidden p-4 sm:p-6 md:p-8">
      <div className="flex w-full max-w-2xl flex-col items-center gap-8">
        {/* Ghost Icon */}
        <div className="w-full max-w-xs">
          <div className="flex w-full items-center justify-center">
            <span className="material-icons-outlined text-primary text-[120px] animate-pulse">
              ghost
            </span>
          </div>
        </div>

        {/* Headline */}
        <h1 className="text-white tracking-tight text-2xl sm:text-3xl font-bold leading-tight text-center">
          Analyzing awesome-project...
        </h1>

        {/* Progress Bar */}
        <div className="flex w-full flex-col gap-3">
          <div className="flex gap-6 justify-between">
            <p className="text-text-muted-dark text-base font-medium leading-normal">
              Overall Progress
            </p>
            <p className="text-white text-sm font-normal leading-normal">
              {progress}%
            </p>
          </div>
          <div className="rounded-full bg-surface-dark">
            <div
              className="h-2 rounded-full progress-bar-fill transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Steps List */}
        <div className="flex w-full flex-col gap-2">
          <h4 className="text-text-muted-dark text-sm font-bold leading-normal tracking-wide px-4 py-2 text-center">
            Current Steps
          </h4>

          {steps.map((step, index) => {
            const status = getStepStatus(index);
            return (
              <div
                key={index}
                className={`flex items-center gap-4 px-4 min-h-14 justify-between rounded-lg transition-all duration-300 ${
                  status === "in-progress"
                    ? "bg-primary/10 border border-primary/30"
                    : "bg-transparent"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center shrink-0 size-10">
                    {status === "completed" && (
                      <span className="material-symbols-outlined text-2xl text-primary">
                        check_circle
                      </span>
                    )}
                    {status === "in-progress" && (
                      <svg
                        className="animate-spin h-6 w-6 text-primary"
                        fill="none"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          fill="currentColor"
                        ></path>
                      </svg>
                    )}
                    {status === "pending" && (
                      <span className="material-symbols-outlined text-2xl text-border-dark">
                        hourglass_empty
                      </span>
                    )}
                  </div>
                  <p
                    className={`text-base font-normal leading-normal flex-1 truncate ${
                      status === "in-progress"
                        ? "text-white"
                        : "text-text-muted-dark"
                    }`}
                  >
                    {step.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Helper Text & Cancel Button */}
        <div className="flex flex-col items-center gap-6 pt-6">
          <p className="text-text-muted-dark text-sm text-center">
            This usually takes 2-5 minutes... Feel free to grab a coffee ☕
          </p>
          <button
            onClick={() => router.push("/")}
            className="flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-base font-medium leading-6 text-text-muted-dark hover:text-primary transition-colors"
          >
            Cancel Analysis
          </button>
        </div>
      </div>
    </div>
  );
}
