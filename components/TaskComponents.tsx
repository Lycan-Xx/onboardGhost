'use client';

import { useState } from 'react';

// Task Steps Component
interface TaskStep {
  order: number;
  action: string;
  details: string;
  os_specific: {
    mac?: string;
    windows?: string;
    linux?: string;
  } | null;
}

export function TaskSteps({ steps }: { steps: TaskStep[] }) {
  return (
    <div className="space-y-3">
      {steps.map((step) => (
        <div key={step.order}>
          <p className="font-medium text-white mb-1">{step.action}</p>
          <p
            className="text-gray-400 text-sm leading-relaxed"
            dangerouslySetInnerHTML={{
              __html: step.details
                .replace(/\*\*(.*?)\*\*/g, '<strong class="text-pink-400">$1</strong>')
                .replace(/`(.*?)`/g, '<code class="bg-gray-800/50 px-1.5 py-0.5 rounded text-pink-300 font-mono text-xs">$1</code>'),
            }}
          />

          {/* OS-Specific Instructions */}
          {step.os_specific && (
            <div className="mt-2 space-y-1 text-sm text-gray-400">
              {step.os_specific.mac && (
                <p><span className="font-medium">Mac:</span> {step.os_specific.mac}</p>
              )}
              {step.os_specific.windows && (
                <p><span className="font-medium">Windows:</span> {step.os_specific.windows}</p>
              )}
              {step.os_specific.linux && (
                <p><span className="font-medium">Linux:</span> {step.os_specific.linux}</p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Command Blocks Component
interface CommandBlock {
  command: string;
  description: string;
  expected_output: string;
  os: 'all' | 'mac' | 'windows' | 'linux';
}

export function CommandBlocks({ commands }: { commands: (string | CommandBlock)[] }) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-3">
      {commands.map((cmd, index) => {
        const command = typeof cmd === 'string' ? cmd : cmd.command;
        const description = typeof cmd === 'string' ? '' : cmd.description;

        return (
          <div key={index}>
            <p className="text-sm text-gray-400 mb-2">
              You can create the file using the following command:
            </p>
            <pre className="bg-gray-900/70 p-4 rounded-md text-sm text-gray-300 border border-gray-700 relative group">
              <code>{command}</code>
              <button
                onClick={() => copyToClipboard(command, index)}
                className="absolute top-2 right-2 text-gray-500 hover:text-pink-400 transition-colors opacity-0 group-hover:opacity-100"
              >
                {copiedIndex === index ? (
                  <span className="text-xs text-green-400">✓</span>
                ) : (
                  <span className="text-xs">Copy</span>
                )}
              </button>
            </pre>
            {description && (
              <p className="text-xs text-gray-500 mt-1">{description}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Code Blocks Component
interface CodeBlock {
  type: 'file_content' | 'snippet' | 'configuration';
  file_path?: string;
  language: string;
  content: string;
  explanation: string;
  highlights?: Array<{
    line: number;
    text: string;
    type: 'info' | 'warning' | 'error';
  }>;
}

export function CodeBlocks({ codeBlocks }: { codeBlocks: CodeBlock[] }) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-4">
      {codeBlocks.map((block, index) => (
        <div key={index}>
          {block.explanation && (
            <p className="text-sm text-gray-400 mb-2">{block.explanation}</p>
          )}
          <pre className="bg-gray-900/70 p-4 rounded-md text-sm text-gray-300 border border-gray-700 overflow-x-auto relative group">
            <code>{block.content}</code>
            <button
              onClick={() => copyToClipboard(block.content, index)}
              className="absolute top-2 right-2 text-gray-500 hover:text-pink-400 transition-colors opacity-0 group-hover:opacity-100"
            >
              {copiedIndex === index ? (
                <span className="text-xs text-green-400">✓</span>
              ) : (
                <span className="text-xs">Copy</span>
              )}
            </button>
          </pre>
          {block.file_path && (
            <p className="text-xs text-gray-500 mt-1">File: {block.file_path}</p>
          )}
        </div>
      ))}
    </div>
  );
}

// References Component
interface Reference {
  text: string;
  url: string;
  type: 'documentation' | 'tutorial' | 'tool' | 'external';
  relevance: string;
}

export function ReferencesSection({ references }: { references: Reference[] }) {
  return (
    <div className="space-y-2">
      {references.map((ref, index) => (
        <a
          key={index}
          href={ref.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-sm text-pink-400 hover:text-pink-300 underline"
        >
          {ref.text}
        </a>
      ))}
    </div>
  );
}

// Tips Component
interface Tip {
  text: string;
  type: 'pro_tip' | 'beginner_friendly' | 'time_saver';
  emphasis: string[];
}

export function TipsSection({ tips }: { tips: (string | Tip)[] }) {
  const formatText = (text: string, emphasis: string[] = []) => {
    let formatted = text;
    emphasis.forEach((phrase) => {
      const regex = new RegExp(`(${phrase})`, 'gi');
      formatted = formatted.replace(regex, '<strong class="text-pink-400">$1</strong>');
    });
    return formatted
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-pink-400">$1</strong>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-800/50 px-1.5 py-0.5 rounded text-pink-300 font-mono text-xs">$1</code>');
  };

  // Filter out null/undefined tips
  const validTips = tips.filter(tip => tip != null);

  if (validTips.length === 0) return null;

  return (
    <div className="space-y-2">
      {validTips.map((tip, index) => {
        const text = typeof tip === 'string' ? tip : tip.text;
        const emphasis = typeof tip === 'string' ? [] : tip.emphasis || [];

        if (!text) return null;

        return (
          <p
            key={index}
            className="text-sm text-gray-400 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: formatText(text, emphasis) }}
          />
        );
      })}
    </div>
  );
}

// Warnings Component
interface Warning {
  text: string;
  severity: 'critical' | 'important' | 'minor';
  os_specific: boolean;
  emphasis: string[];
}

export function WarningsSection({ warnings }: { warnings: (string | Warning)[] }) {
  const formatText = (text: string, emphasis: string[] = []) => {
    let formatted = text;
    emphasis.forEach((phrase) => {
      const regex = new RegExp(`(${phrase})`, 'gi');
      formatted = formatted.replace(regex, '<strong class="text-pink-400">$1</strong>');
    });
    return formatted
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-pink-400">$1</strong>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-800/50 px-1.5 py-0.5 rounded text-pink-300 font-mono text-xs">$1</code>');
  };

  // Filter out null/undefined warnings
  const validWarnings = warnings.filter(warning => warning != null);

  if (validWarnings.length === 0) return null;

  return (
    <div className="space-y-2">
      {validWarnings.map((warning, index) => {
        const text = typeof warning === 'string' ? warning : warning.text;
        const emphasis = typeof warning === 'string' ? [] : warning.emphasis || [];

        if (!text) return null;

        return (
          <p
            key={index}
            className="text-sm text-yellow-400 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: formatText(text, emphasis) }}
          />
        );
      })}
    </div>
  );
}

// Verification Component - Commented out until data is populated
/*
interface Verification {
  how_to_verify: string;
  expected_result: string;
  troubleshooting: Array<{
    problem: string;
    solution: string;
    command: string | null;
  }>;
}

export function VerificationSection({ verification }: { verification: Verification }) {
  const [isOpen, setIsOpen] = useState(false);

  // Don't render if verification data is empty
  if (!verification?.how_to_verify && !verification?.expected_result) {
    return null;
  }

  return (
    <div className="bg-green-900/10 border border-green-500/30 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-green-900/20 transition-colors"
      >
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-400" />
          <div>
            <h3 className="font-semibold text-white text-lg">Verification</h3>
            <p className="text-xs text-gray-400">How to check if this worked</p>
          </div>
        </div>
        <ChevronDown 
          className={`w-5 h-5 text-green-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="px-4 pb-4 space-y-4 border-t border-green-500/30">
          {verification.how_to_verify && (
            <div className="mt-4">
              <p className="text-xs font-semibold text-green-400 uppercase tracking-wide mb-2">
                How to Verify
              </p>
              <p className="text-sm text-gray-300 leading-relaxed">
                {verification.how_to_verify}
              </p>
            </div>
          )}

          {verification.expected_result && (
            <div>
              <p className="text-xs font-semibold text-green-400 uppercase tracking-wide mb-2">
                Expected Result
              </p>
              <p className="text-sm text-gray-300 leading-relaxed bg-gray-900/50 p-3 rounded border border-gray-800">
                {verification.expected_result}
              </p>
            </div>
          )}

          {verification.troubleshooting && verification.troubleshooting.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-yellow-400 uppercase tracking-wide mb-2">
                Common Issues
              </p>
              <div className="space-y-3">
                {verification.troubleshooting.map((item, index) => (
                  <div key={index} className="bg-gray-900/50 border border-gray-800 rounded-lg p-3">
                    <p className="text-sm font-semibold text-red-300 mb-1">
                      Problem: {item.problem}
                    </p>
                    <p className="text-sm text-gray-300 mb-2">
                      Solution: {item.solution}
                    </p>
                    {item.command && (
                      <pre className="text-xs font-mono text-pink-300 bg-[#0a0a0f] p-2 rounded mt-2">
                        {item.command}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
*/
