'use client';

import { useState, useRef, useEffect } from 'react';

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

export default function GhostMentorChat({ repoId, userId }: GhostMentorChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [rateLimitWarning, setRateLimitWarning] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (chatOpen && messages.length === 0) {
      loadChatHistory();
    }
  }, [chatOpen]);

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

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setRateLimitWarning(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage,
          repoId,
          userId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          setRateLimitWarning(data.error || 'Rate limit exceeded. Please try again later.');
        }
        throw new Error(data.error || 'Failed to send message');
      }

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        file_references: data.file_references,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <footer className="fixed bottom-0 left-0 right-0 flex justify-center pointer-events-none z-50">
      <div className="w-full max-w-3xl pointer-events-auto">
        {!chatOpen && (
          <div className="flex justify-center transition-all duration-300">
            <button
              onClick={() => setChatOpen(true)}
              className="mb-4 flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 font-semibold hover:border-purple-600 hover:text-purple-600 hover:shadow-lg transition-all shadow-md"
            >
              <span className="text-purple-600 text-xl">👻</span>
              Ask Ghost Mentor AI
            </button>
          </div>
        )}

        {chatOpen && (
          <div className="h-[70vh] max-h-[600px] bg-white/95 backdrop-blur-xl border-t-2 border-x-2 border-purple-600 rounded-t-lg shadow-2xl flex flex-col transition-all duration-300">
            {/* Header */}
            <header className="flex justify-between items-center p-4 border-b border-gray-200 flex-shrink-0">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <span className="text-purple-600 text-xl">👻</span>
                Ghost Mentor AI
              </h2>
              <button
                onClick={() => setChatOpen(false)}
                className="p-1 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </header>

            {/* Rate Limit Warning */}
            {rateLimitWarning && (
              <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-3 text-sm">
                {rateLimitWarning}
              </div>
            )}

            {/* Messages */}
            <div className="flex-grow p-4 sm:p-6 overflow-y-auto space-y-6">
              {messages.length === 0 && (
                <div className="flex justify-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex-shrink-0 flex items-center justify-center">
                    <span className="text-purple-600 text-lg">👻</span>
                  </div>
                  <div className="bg-gray-100 p-3 rounded-lg max-w-md">
                    <p className="text-gray-900">
                      Hello! I'm your Ghost Mentor. Ask me anything about this repository!
                    </p>
                  </div>
                </div>
              )}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex-shrink-0 flex items-center justify-center">
                      <span className="text-purple-600 text-lg">👻</span>
                    </div>
                  )}
                  
                  <div
                    className={`p-3 rounded-lg max-w-md ${
                      message.role === 'user'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    
                    {message.file_references && message.file_references.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-300">
                        <p className="text-xs font-semibold mb-1">📁 Referenced files:</p>
                        {message.file_references.map((file, index) => (
                          <div key={index} className="text-xs text-blue-600 hover:underline cursor-pointer">
                            {file}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {message.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center">
                      <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex-shrink-0 flex items-center justify-center">
                    <span className="text-purple-600 text-lg">👻</span>
                  </div>
                  <div className="bg-gray-100 p-3 rounded-lg">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="relative">
                <input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full bg-white border border-gray-300 rounded-md py-2.5 pl-4 pr-12 focus:ring-2 focus:ring-purple-600 focus:border-purple-600 text-gray-900 placeholder:text-gray-500"
                  placeholder="Ask a question..."
                  type="text"
                  disabled={isLoading}
                />
                <button
                  onClick={sendMessage}
                  disabled={isLoading || !inputMessage.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md text-purple-600 hover:bg-purple-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </footer>
  );
}
