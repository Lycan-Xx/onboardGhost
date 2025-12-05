'use client';

import { useState } from 'react';
import { 
  ListOrdered, 
  Terminal, 
  Code2, 
  Link as LinkIcon, 
  Lightbulb, 
  AlertTriangle,
  CheckCircle2,
  ChevronDown
} from 'lucide-react';

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
    <div>
      <h3 className="font-semibold text-white mb-4 flex items-center gap-2 text-lg">
        <ListOrdered className="w-5 h-5 text-pink-400" />
        Steps
      </h3>
      <ol className="space-y-4">
        {steps.map((step) => (
          <li key={step.order} className="flex gap-4">
            {/* Step Number */}
            <div className="flex-shrink-0 w-8 h-8 bg-pink-600/20 border border-pink-500/30 rounded-full flex items-center justify-center text-pink-400 font-semibold text-sm">
              {step.order}
            </div>

            {/* Step Content */}
            <div className="flex-1">
              <p className="font-semibold text-white mb-2">{step.action}</p>
              <p
                className="text-gray-400 text-sm leading-relaxed mb-3"
                dangerouslySetInnerHTML={{
                  __html: step.details
                    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-pink-400">$1</strong>')
                    .replace(/`(.*?)`/g, '<code class="bg-gray-900 px-1.5 py-0.5 rounded text-pink-300 font-mono text-xs">$1</code>'),
                }}
              />

              {/* OS-Specific Instructions */}
              {step.os_specific && (
                <div className="mt-3 space-y-2">
                  {step.os_specific.mac && (
                    <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-3">
                      <p className="text-xs font-semibold text-blue-400 mb-1 flex items-center gap-1.5">
                        <span>🍎</span> Mac
                      </p>
                      <p className="text-sm text-gray-300">{step.os_specific.mac}</p>
                    </div>
                  )}
                  {step.os_specific.windows && (
                    <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-3">
                      <p className="text-xs font-semibold text-cyan-400 mb-1 flex items-center gap-1.5">
                        <span>🪟</span> Windows
                      </p>
                      <p className="text-sm text-gray-300">{step.os_specific.windows}</p>
                    </div>
                  )}
                  {step.os_specific.linux && (
                    <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-3">
                      <p className="text-xs font-semibold text-yellow-400 mb-1 flex items-center gap-1.5">
                        <span>🐧</span> Linux
                      </p>
                      <p className="text-sm text-gray-300">{step.os_specific.linux}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>
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

  const getOSBadge = (os: string) => {
    const badges: Record<string, { icon: string; label: string; color: string }> = {
      all: { icon: '🌐', label: 'All OS', color: 'text-gray-400' },
      mac: { icon: '🍎', label: 'Mac', color: 'text-blue-400' },
      windows: { icon: '🪟', label: 'Windows', color: 'text-cyan-400' },
      linux: { icon: '🐧', label: 'Linux', color: 'text-yellow-400' },
    };
    return badges[os] || badges.all;
  };

  return (
    <div>
      <h3 className="font-semibold text-white mb-4 flex items-center gap-2 text-lg">
        <Terminal className="w-5 h-5 text-pink-400" />
        Commands
      </h3>
      <div className="space-y-3">
        {commands.map((cmd, index) => {
          // Handle old format (string)
          if (typeof cmd === 'string') {
            return (
              <div key={index} className="bg-[#0a0a0f] border border-gray-800 rounded-lg overflow-hidden group">
                <div className="flex items-center justify-between p-3 bg-gray-900/30 border-b border-gray-800">
                  <span className="text-xs text-gray-400 font-mono">Command</span>
                  <button
                    onClick={() => copyToClipboard(cmd, index)}
                    className="text-gray-400 hover:text-pink-400 transition-colors"
                  >
                    {copiedIndex === index ? (
                      <span className="text-green-400 text-xs">✓ Copied</span>
                    ) : (
                      <span className="text-xs">📋 Copy</span>
                    )}
                  </button>
                </div>
                <pre className="p-4 text-sm font-mono overflow-x-auto custom-scrollbar">
                  <code className="text-pink-300">{cmd}</code>
                </pre>
              </div>
            );
          }

          // Handle new format (CommandBlock object)
          const badge = getOSBadge(cmd.os);
          return (
            <div key={index} className="bg-[#0a0a0f] border border-gray-800 rounded-lg overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-3 bg-gray-900/30 border-b border-gray-800">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold ${badge.color} flex items-center gap-1`}>
                    <span>{badge.icon}</span>
                    {badge.label}
                  </span>
                </div>
                <button
                  onClick={() => copyToClipboard(cmd.command, index)}
                  className="text-gray-400 hover:text-pink-400 transition-colors"
                >
                  {copiedIndex === index ? (
                    <span className="text-green-400 text-xs font-semibold">✓ Copied!</span>
                  ) : (
                    <span className="text-xs">📋 Copy</span>
                  )}
                </button>
              </div>

              {/* Command */}
              <div className="p-4">
                <pre className="text-sm font-mono overflow-x-auto custom-scrollbar mb-3">
                  <code className="text-pink-300">{cmd.command}</code>
                </pre>

                {/* Description */}
                {cmd.description && (
                  <p className="text-xs text-gray-400 mb-2">
                    <span className="font-semibold text-gray-500">Description:</span> {cmd.description}
                  </p>
                )}

                {/* Expected Output */}
                {cmd.expected_output && (
                  <div className="mt-3 bg-gray-900/50 border border-gray-800/50 rounded p-2">
                    <p className="text-xs font-semibold text-green-400 mb-1">Expected Output:</p>
                    <p className="text-xs text-gray-400 font-mono">{cmd.expected_output}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
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
    <div>
      <h3 className="font-semibold text-white mb-4 flex items-center gap-2 text-lg">
        <Code2 className="w-5 h-5 text-pink-400" />
        Code
      </h3>
      <div className="space-y-4">
        {codeBlocks.map((block, index) => (
          <div key={index} className="bg-[#0a0a0f] border border-gray-800 rounded-lg overflow-hidden">
            {/* File Header */}
            <div className="flex items-center justify-between p-3 bg-gray-900/50 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <span className="text-pink-400">📄</span>
                <span className="text-sm text-gray-300 font-mono">
                  {block.file_path || `${block.language} code`}
                </span>
                <span className="text-xs text-gray-500 px-2 py-0.5 bg-gray-800 rounded">
                  {block.language}
                </span>
              </div>
              <button
                onClick={() => copyToClipboard(block.content, index)}
                className="text-gray-400 hover:text-pink-400 transition-colors"
              >
                {copiedIndex === index ? (
                  <span className="text-green-400 text-xs font-semibold">✓ Copied!</span>
                ) : (
                  <span className="text-xs">📋 Copy</span>
                )}
              </button>
            </div>

            {/* Code Content */}
            <pre className="p-4 text-sm font-mono overflow-x-auto custom-scrollbar">
              <code className="text-gray-300">{block.content}</code>
            </pre>

            {/* Explanation */}
            {block.explanation && (
              <div className="px-4 pb-4">
                <p className="text-xs text-gray-400 italic">{block.explanation}</p>
              </div>
            )}

            {/* Highlights */}
            {block.highlights && block.highlights.length > 0 && (
              <div className="px-4 pb-4 space-y-2">
                {block.highlights.map((highlight, hIndex) => {
                  const colors = {
                    info: 'bg-blue-900/20 border-blue-500/30 text-blue-300',
                    warning: 'bg-yellow-900/20 border-yellow-500/30 text-yellow-300',
                    error: 'bg-red-900/20 border-red-500/30 text-red-300',
                  };
                  return (
                    <div
                      key={hIndex}
                      className={`border-l-4 p-2 rounded-r text-xs ${colors[highlight.type]}`}
                    >
                      <span className="font-semibold">Line {highlight.line}:</span> {highlight.text}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
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
  const getIcon = (type: string) => {
    const icons: Record<string, string> = {
      documentation: '📚',
      tutorial: '🎓',
      tool: '🔧',
      external: '🔗',
    };
    return icons[type] || '🔗';
  };

  return (
    <div>
      <h3 className="font-semibold text-white mb-4 flex items-center gap-2 text-lg">
        <LinkIcon className="w-5 h-5 text-pink-400" />
        Helpful Links
      </h3>
      <div className="space-y-3">
        {references.map((ref, index) => (
          <a
            key={index}
            href={ref.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-gray-900/30 border border-gray-800 hover:border-pink-500/50 rounded-lg p-4 transition-all hover:bg-gray-900/50 group"
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">{getIcon(ref.type)}</span>
              <div className="flex-1">
                <p className="text-white font-semibold group-hover:text-pink-400 transition-colors flex items-center gap-2">
                  {ref.text}
                  <svg
                    className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </p>
                <p className="text-xs text-gray-400 mt-1">{ref.relevance}</p>
                <p className="text-xs text-pink-400/70 mt-1 font-mono">{ref.url}</p>
              </div>
            </div>
          </a>
        ))}
      </div>
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
  const getIcon = (type: string) => {
    const icons: Record<string, string> = {
      pro_tip: '🎯',
      beginner_friendly: '🌱',
      time_saver: '⚡',
    };
    return icons[type] || '💡';
  };

  const formatText = (text: string, emphasis: string[] = []) => {
    let formatted = text;
    emphasis.forEach((phrase) => {
      const regex = new RegExp(`(${phrase})`, 'gi');
      formatted = formatted.replace(regex, '<strong class="text-pink-400">$1</strong>');
    });
    return formatted
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-pink-400">$1</strong>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-900 px-1.5 py-0.5 rounded text-pink-300 font-mono text-xs">$1</code>');
  };

  // Filter out null/undefined tips
  const validTips = tips.filter(tip => tip != null);

  if (validTips.length === 0) return null;

  return (
    <div>
      <h3 className="font-semibold text-white mb-4 flex items-center gap-2 text-lg">
        <Lightbulb className="w-5 h-5 text-pink-400" />
        Tips
      </h3>
      <div className="space-y-3">
        {validTips.map((tip, index) => {
          // Handle old format (string)
          if (typeof tip === 'string') {
            return (
              <div
                key={index}
                className="bg-blue-900/10 border-l-4 border-blue-500 p-4 rounded-r-lg"
              >
                <p className="text-sm text-blue-300 leading-relaxed">{tip}</p>
              </div>
            );
          }

          // Handle new format (Tip object) - with null checks
          if (!tip || !tip.text) return null;

          return (
            <div
              key={index}
              className="bg-blue-900/10 border-l-4 border-blue-500 p-4 rounded-r-lg"
            >
              <div className="flex items-start gap-3">
                <span className="text-xl flex-shrink-0">{getIcon(tip.type || 'pro_tip')}</span>
                <p
                  className="text-sm text-blue-300 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: formatText(tip.text, tip.emphasis || []) }}
                />
              </div>
            </div>
          );
        })}
      </div>
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
  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      critical: 'bg-red-900/10 border-red-500 text-red-300',
      important: 'bg-orange-900/10 border-orange-500 text-orange-300',
      minor: 'bg-yellow-900/10 border-yellow-500 text-yellow-300',
    };
    return colors[severity] || colors.important;
  };

  const formatText = (text: string, emphasis: string[] = []) => {
    let formatted = text;
    emphasis.forEach((phrase) => {
      const regex = new RegExp(`(${phrase})`, 'gi');
      formatted = formatted.replace(regex, '<strong class="text-pink-400">$1</strong>');
    });
    return formatted
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-pink-400">$1</strong>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-900 px-1.5 py-0.5 rounded text-pink-300 font-mono text-xs">$1</code>');
  };

  // Filter out null/undefined warnings
  const validWarnings = warnings.filter(warning => warning != null);

  if (validWarnings.length === 0) return null;

  return (
    <div>
      <h3 className="font-semibold text-white mb-4 flex items-center gap-2 text-lg">
        <AlertTriangle className="w-5 h-5 text-pink-400" />
        Warnings
      </h3>
      <div className="space-y-3">
        {validWarnings.map((warning, index) => {
          // Handle old format (string)
          if (typeof warning === 'string') {
            return (
              <div
                key={index}
                className="bg-red-900/10 border-l-4 border-red-500 p-4 rounded-r-lg"
              >
                <p className="text-sm text-red-300 leading-relaxed">{warning}</p>
              </div>
            );
          }

          // Handle new format (Warning object) - with null checks
          if (!warning || !warning.text) return null;

          return (
            <div
              key={index}
              className={`border-l-4 p-4 rounded-r-lg ${getSeverityColor(warning.severity || 'important')}`}
            >
              <div className="flex items-start gap-3">
                <span className="text-xl flex-shrink-0">⚠️</span>
                <div>
                  {warning.os_specific && (
                    <p className="text-xs font-semibold uppercase tracking-wide mb-1 opacity-70">
                      OS-Specific Warning
                    </p>
                  )}
                  <p
                    className="text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: formatText(warning.text, warning.emphasis || []) }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
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
