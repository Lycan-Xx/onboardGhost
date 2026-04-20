'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Sparkles, X, Send, Loader2, FileCode, Copy, Check } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  file_references?: string[];
}

interface GhostMentorChatProps {
  repoId: string;
  userId: string;
}

const SUGGESTIONS = [
  'What does this repo do?',
  'Where should I start?',
  'Explain the build setup',
];

export default function GhostMentorChat({ repoId, userId }: GhostMentorChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [rateLimitWarning, setRateLimitWarning] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Persist open state
  useEffect(() => {
    const saved = typeof window !== 'undefined' && localStorage.getItem('ghost-chat-open');
    if (saved === '1') setChatOpen(true);
  }, []);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ghost-chat-open', chatOpen ? '1' : '0');
    }
  }, [chatOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    if (chatOpen && messages.length === 0) loadChatHistory();
  }, [chatOpen]);

  // Auto-resize textarea
  useEffect(() => {
    const t = textareaRef.current;
    if (!t) return;
    t.style.height = 'auto';
    t.style.height = `${Math.min(t.scrollHeight, 144)}px`;
  }, [inputMessage]);

  const loadChatHistory = async () => {
    try {
      const response = await fetch(`/api/chat-history?repoId=${repoId}&userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  };

  const sendMessage = async (overrideText?: string) => {
    const text = (overrideText ?? inputMessage).trim();
    if (!text || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setRateLimitWarning(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, repoId, userId }),
      });

      const data = await response.json();
      if (!response.ok) {
        if (response.status === 429) {
          setRateLimitWarning(data.error || 'Rate limit exceeded. Please try again later.');
        }
        throw new Error(data.error || 'Failed to send message');
      }

      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        file_references: data.file_references,
      }]);
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const copyMessage = async (id: string, content: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <>
      {/* Toggle button */}
      {!chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-2 rounded-full bg-accent text-white px-4 py-2.5 text-sm font-medium shadow-2xl hover:bg-accent-hover transition-colors"
        >
          <Sparkles size={15} />
          Ghost Mentor
        </button>
      )}

      {/* Panel */}
      {chatOpen && (
        <aside className="fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] bg-surface border-l border-border-strong shadow-2xl flex flex-col">
          {/* Header */}
          <header className="flex items-center justify-between px-4 h-14 border-b border-border shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-accent-soft border border-accent/30 grid place-items-center">
                <Sparkles size={14} className="text-accent" />
              </div>
              <div>
                <p className="text-sm font-medium text-fg leading-tight">Ghost Mentor</p>
                <p className="text-[10px] text-subtle leading-tight">AI guide for this repo</p>
              </div>
            </div>
            <button
              onClick={() => setChatOpen(false)}
              className="p-1.5 rounded-md text-muted hover:text-fg hover:bg-surface-2 transition-colors"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </header>

          {/* Rate limit */}
          {rateLimitWarning && (
            <div className="px-4 py-2.5 bg-accent-soft border-b border-accent/30 text-xs text-accent">
              {rateLimitWarning}
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-5 space-y-5">
            {messages.length === 0 && (
              <div className="space-y-4">
                <div className="text-sm text-muted leading-relaxed">
                  Hi 👋 I've read the codebase. Ask me anything — from "what is this?" to "where do I add a new route?".
                </div>
                <div className="space-y-1.5">
                  <p className="text-[10px] uppercase tracking-wider text-subtle">Suggestions</p>
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => sendMessage(s)}
                      className="block w-full text-left text-sm px-3 py-2 rounded-lg border border-border hover:border-accent/40 hover:bg-surface-2 transition-colors text-fg"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`group max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${
                    message.role === 'user'
                      ? 'bg-accent text-white rounded-br-sm'
                      : 'bg-surface-2 border border-border text-fg rounded-bl-sm'
                  }`}
                >
                  {message.role === 'assistant' ? (
                    <div className="chat-prose">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  )}

                  {message.file_references && message.file_references.length > 0 && (
                    <div className="mt-2.5 pt-2.5 border-t border-border flex flex-wrap gap-1.5">
                      {message.file_references.map((file, i) => (
                        <span key={i} className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-bg/50 border border-border text-muted">
                          <FileCode size={10} />
                          {file}
                        </span>
                      ))}
                    </div>
                  )}

                  {message.role === 'assistant' && (
                    <button
                      onClick={() => copyMessage(message.id, message.content)}
                      className="mt-1.5 inline-flex items-center gap-1 text-[10px] text-subtle hover:text-fg transition-colors opacity-0 group-hover:opacity-100"
                    >
                      {copiedId === message.id ? <><Check size={10} /> Copied</> : <><Copy size={10} /> Copy</>}
                    </button>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-surface-2 border border-border rounded-2xl rounded-bl-sm px-3.5 py-3 w-32">
                  <div className="h-1 rounded-full bg-bg overflow-hidden relative">
                    <div className="absolute inset-0 shimmer" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-border p-3 shrink-0">
            <div className="flex items-end gap-2 rounded-xl bg-surface-2 border border-border focus-within:border-accent/50 transition-colors p-2">
              <textarea
                ref={textareaRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder="Ask about this repo…"
                disabled={isLoading}
                className="flex-1 bg-transparent resize-none px-2 py-1 text-sm text-fg placeholder:text-subtle outline-none max-h-36"
              />
              <button
                onClick={() => sendMessage()}
                disabled={isLoading || !inputMessage.trim()}
                className="p-2 rounded-lg bg-accent text-white hover:bg-accent-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Send"
              >
                {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              </button>
            </div>
            <p className="mt-1.5 text-[10px] text-subtle px-1">
              Enter to send · Shift+Enter for newline
            </p>
          </div>
        </aside>
      )}
    </>
  );
}
