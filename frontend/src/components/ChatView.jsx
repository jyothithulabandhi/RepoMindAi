import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare, AlertCircle, FileCode, Sparkles, Cpu } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';
import { apiFetch } from '../api';

const ChatView = ({ repositoryId, repoName }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const messagesEndRef = useRef(null);

  const suggestions = [
    'What does this project do?',
    'Explain the primary entrypoint and runtime flow.',
    'Which external libraries/dependencies are most critical?',
    'Explain the data models or core service logic.'
  ];

  // Scroll to bottom on new messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (text) => {
    const query = text.trim();
    if (!query) return;

    // Add user message
    const userMsg = { role: 'user', text: query };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    setError('');

    try {
      const data = await apiFetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repository_id: repositoryId,
          question: query
        })
      });
      
      // Add assistant response
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: data.answer,
          sources: data.sources || []
        }
      ]);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Something went wrong. Make sure you set your API keys.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-full flex bg-slate-950 overflow-hidden relative">
      <div className="bg-glow bottom-0 right-1/4 animate-pulse-slow"></div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full z-10 max-w-4xl mx-auto px-6 py-8">
        
        {/* Header */}
        <div className="pb-4 border-b border-gray-800/80 mb-6 shrink-0 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-indigo-400" />
              <span>Codebase Chat AI</span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Ask questions about scripts, flow, models, or config files.</p>
          </div>
          <div className="px-3 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center gap-1.5 text-[10px] font-semibold text-indigo-300 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>RAG Active</span>
          </div>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-6 pb-6 scroll-smooth">
          {messages.length === 0 ? (
            /* Suggestions view if history empty */
            <div className="h-full flex flex-col items-center justify-center space-y-8 max-w-lg mx-auto text-center">
              <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400">
                <Cpu className="w-8 h-8 animate-pulse" />
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-bold text-white tracking-wide">Ask RepoMind AI anything</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Ask about code patterns, route handlers, tech dependencies, or overall architectural logic. The AI will cite source files.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full pt-4">
                {suggestions.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(s)}
                    className="p-4 rounded-2xl glass-card text-left text-xs text-gray-300 border border-gray-850 hover:border-indigo-600/40 hover:bg-indigo-600/5 font-medium transition-all duration-200"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Message list */
            <>
              {messages.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {/* Bot Avatar */}
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 shrink-0 flex items-center justify-center shadow shadow-indigo-600/20 text-white font-bold text-xs select-none">
                      AI
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div className={`max-w-[85%] rounded-2xl p-5 border shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 border-indigo-500 text-white rounded-tr-none'
                      : 'bg-gray-900/60 border-gray-850 rounded-tl-none flex flex-col gap-3'
                  }`}>
                    {msg.role === 'user' ? (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    ) : (
                      <>
                        <MarkdownRenderer content={msg.text} />
                        
                        {/* Citations / Sources */}
                        {msg.sources && msg.sources.length > 0 && (
                          <div className="mt-2 pt-3 border-t border-gray-800/80">
                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-2">Cited Sources:</span>
                            <div className="flex flex-wrap gap-1.5">
                              {msg.sources.map((src, sIdx) => (
                                <span 
                                  key={sIdx} 
                                  className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-gray-800/80 border border-gray-700 text-[10px] font-mono text-gray-400 hover:text-indigo-300 hover:border-indigo-600/30 cursor-default transition-all duration-150"
                                  title={src}
                                >
                                  <FileCode className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                  <span className="truncate max-w-[150px]">{src.split('/').pop()}</span>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* User Avatar */}
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-lg bg-gray-800 border border-gray-700 shrink-0 flex items-center justify-center text-gray-300 font-bold text-xs select-none">
                      U
                    </div>
                  )}
                </div>
              ))}

              {/* Bot Loading/Typing State */}
              {isLoading && (
                <div className="flex gap-4 justify-start">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 shrink-0 flex items-center justify-center text-white font-bold text-xs animate-pulse">
                    AI
                  </div>
                  <div className="bg-gray-900/60 border border-gray-850 rounded-2xl rounded-tl-none p-5 flex items-center justify-center w-24">
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"></div>
                      <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.2s]"></div>
                      <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.4s]"></div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {error && (
            <div className="p-4 bg-red-900/30 border border-red-500/30 rounded-2xl flex items-start gap-3 text-left">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <p className="text-xs text-red-200 leading-normal">{error}</p>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(input); }} 
          className="relative flex items-center shrink-0 mt-2"
        >
          <input
            type="text"
            placeholder={isLoading ? "Thinking..." : "Ask a question about this repository..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            className="w-full pl-6 pr-16 py-4 rounded-2xl glass-input text-white text-sm placeholder-gray-500 shadow-inner"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="absolute right-3 p-2.5 rounded-xl bg-indigo-600 disabled:bg-gray-800/80 text-white disabled:text-gray-600 transition-all duration-200"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatView;
