import React, { useState, useRef, useEffect } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Sparkles, X, Loader2 } from 'lucide-react';

const CodeViewer = ({ filename, content }) => {
  const [selectedText, setSelectedText] = useState('');
  const [showButton, setShowButton] = useState(false);
  const [buttonPos, setButtonPos] = useState({ top: 0, left: 0 });
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [explanation, setExplanation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [explanationCode, setExplanationCode] = useState('');

  const containerRef = useRef(null);

  // Clear selections and button when filename changes
  useEffect(() => {
    setShowButton(false);
    setIsPanelOpen(false);
    setExplanation('');
    setSelectedText('');
  }, [filename]);

  const getLanguage = (name) => {
    if (!name) return 'text';
    const ext = name.split('.').pop().toLowerCase();
    const mappings = {
      py: 'python',
      js: 'javascript',
      jsx: 'jsx',
      ts: 'typescript',
      tsx: 'tsx',
      html: 'html',
      css: 'css',
      sh: 'bash',
      bash: 'bash',
      go: 'go',
      rs: 'rust',
      java: 'java',
      md: 'markdown',
      json: 'json',
      yml: 'yaml',
      yaml: 'yaml',
      toml: 'toml',
      dockerfile: 'dockerfile'
    };
    return mappings[ext] || 'text';
  };

  const handleMouseUp = () => {
    const selection = window.getSelection();
    const text = selection.toString();

    if (text && text.trim().length > 20) {
      setSelectedText(text);
      
      try {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        const container = containerRef.current;

        if (container) {
          const containerRect = container.getBoundingClientRect();
          
          // Position the button centered below the selection bounding box, with scroll offset accounted
          const top = rect.bottom - containerRect.top + container.scrollTop + 10;
          const left = rect.left - containerRect.left + container.scrollLeft + (rect.width / 2) - 60;
          
          setButtonPos({ top, left });
          setShowButton(true);
        }
      } catch (err) {
        console.error("Error positioning floating selection button:", err);
      }
    } else {
      setShowButton(false);
    }
  };

  const handleExplain = async () => {
    if (!selectedText) return;
    
    // Copy active code context to show inside the explanation panel footer
    setExplanationCode(selectedText);
    setIsPanelOpen(true);
    setIsLoading(true);
    setError('');
    setExplanation('');
    setShowButton(false);

    try {
      const response = await fetch('/api/explain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: selectedText,
          filename: filename
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get explanation from AI.');
      }

      const data = await response.json();
      setExplanation(data.explanation);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to explain the selected code.');
    } finally {
      setIsLoading(false);
      // Clear browser text selection visually
      window.getSelection()?.removeAllRanges();
    }
  };

  return (
    <div className="flex h-full w-full overflow-hidden relative">
      {/* Code Area */}
      <div 
        ref={containerRef}
        onMouseUp={handleMouseUp}
        className="flex-1 overflow-auto h-full relative select-text p-4 bg-slate-950/20 rounded-xl border border-white/5"
      >
        <SyntaxHighlighter
          language={getLanguage(filename)}
          style={vscDarkPlus}
          showLineNumbers={true}
          customStyle={{
            margin: 0,
            background: 'transparent',
            padding: 0,
            fontSize: '0.75rem',
            lineHeight: '1.25rem',
          }}
          lineNumberContainerStyle={{
            float: 'left',
            paddingRight: '12px',
            borderRight: '1px solid rgba(255, 255, 255, 0.05)',
            marginRight: '12px',
            color: '#4b5563',
            userSelect: 'none',
          }}
          lineNumberStyle={{
            color: '#4b5563',
          }}
        >
          {content}
        </SyntaxHighlighter>

        {/* Floating Explain Button */}
        {showButton && (
          <button
            onClick={handleExplain}
            style={{ 
              top: `${buttonPos.top}px`, 
              left: `${buttonPos.left}px` 
            }}
            className="absolute z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-lg shadow-violet-650/40 border border-violet-400/20 transition-all duration-150 hover:scale-105 select-none cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Explain This</span>
          </button>
        )}
      </div>

      {/* Right Explanation Panel */}
      {isPanelOpen && (
        <div className="w-96 border-l border-white/10 bg-slate-950/60 backdrop-blur-md flex flex-col h-full shrink-0 z-20 animate-slide-in relative ml-4">
          {/* Header */}
          <div className="px-5 py-4 border-b border-white/10 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-400" />
              <h3 className="text-sm font-bold text-white tracking-wide">AI Explanation</h3>
            </div>
            <button 
              onClick={() => setIsPanelOpen(false)}
              className="text-gray-500 hover:text-gray-300 transition-colors p-1 rounded-lg hover:bg-white/5 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Explanation Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {isLoading ? (
              <div className="h-full w-full flex flex-col items-center justify-center gap-3 text-gray-500">
                <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
                <span className="text-xs font-medium">Generating explanation...</span>
              </div>
            ) : error ? (
              <div className="p-4 bg-red-900/20 border border-red-500/20 rounded-xl text-xs text-red-300 leading-normal">
                {error}
              </div>
            ) : (
              <div className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap font-sans font-normal">
                {explanation}
              </div>
            )}
          </div>

          {/* Footer (Code Preview) */}
          <div className="p-5 border-t border-white/10 bg-slate-900/30 shrink-0">
            <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Selected Code</span>
            <pre className="mt-2 p-3 bg-slate-950/70 border border-white/5 rounded-xl text-[10px] text-gray-400 font-mono overflow-auto max-h-28">
              <code>{explanationCode}</code>
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default CodeViewer;
