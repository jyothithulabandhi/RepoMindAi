import React, { useState, useEffect } from 'react';
import { Terminal, FileCode, Copy, Check, Loader2 } from 'lucide-react';
import FileTree from './FileTree';
import CodeViewer from './CodeViewer';
import { apiFetch } from '../api';

const CodeExplorerView = ({ repositoryId, fileTree }) => {
  const [selectedPath, setSelectedPath] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!selectedPath) return;

    const fetchFileContent = async () => {
      setIsLoading(true);
      setError('');
      try {
        const text = await apiFetch(`/api/file/${repositoryId}?path=${encodeURIComponent(selectedPath)}`);
        setFileContent(text);
      } catch (err) {
        console.error(err);
        setError(err.message || 'Failed to load file contents.');
        setFileContent('');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFileContent();
  }, [selectedPath, repositoryId]);

  const handleCopy = () => {
    if (!fileContent) return;
    navigator.clipboard.writeText(fileContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getLanguageFromPath = (path) => {
    const ext = path.split('.').pop().toLowerCase();
    const mappings = {
      py: 'Python',
      js: 'JavaScript',
      jsx: 'JavaScript React',
      ts: 'TypeScript',
      tsx: 'TypeScript React',
      json: 'JSON',
      html: 'HTML',
      css: 'CSS',
      sh: 'Shell Script',
      bat: 'PowerShell',
      go: 'Go',
      rs: 'Rust',
      java: 'Java',
      md: 'Markdown',
      yml: 'YAML',
      yaml: 'YAML',
      toml: 'TOML',
      dockerfile: 'Dockerfile'
    };
    return mappings[ext] || 'Text';
  };

  // Convert raw text into lines for rendering line numbers
  const renderCodeWithLineNumbers = () => {
    if (!fileContent) return null;
    const lines = fileContent.split('\n');
    return (
      <div className="flex font-mono text-xs overflow-x-auto h-full text-indigo-100">
        {/* Line Numbers */}
        <div className="text-gray-600 select-none text-right pr-4 border-r border-gray-800 shrink-0 select-none">
          {lines.map((_, i) => (
            <div key={i + 1} className="h-5 pr-1">{i + 1}</div>
          ))}
        </div>
        {/* Code Content */}
        <div className="pl-4 shrink-0 min-w-full">
          {lines.map((line, i) => (
            <div key={i + 1} className="h-5 whitespace-pre pr-6 hover:bg-indigo-500/5">{line || '\u00A0'}</div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full flex bg-slate-950 p-6 gap-6 overflow-hidden relative">
      <div className="bg-glow top-0 left-1/4 animate-pulse-slow"></div>

      {/* Left Column: Explorer Tree */}
      <div className="w-80 glass-panel rounded-2xl border border-white/5 flex flex-col overflow-hidden z-10 shrink-0">
        <div className="p-4 border-b border-gray-800/80 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-indigo-400" />
          <span className="font-bold text-xs uppercase tracking-wider text-white">Repository Files</span>
        </div>
        <div className="flex-1 p-3 overflow-y-auto">
          <FileTree
            treeData={fileTree}
            onFileSelect={setSelectedPath}
            selectedPath={selectedPath}
          />
        </div>
      </div>

      {/* Right Column: Code Viewer */}
      <div className="flex-1 glass-panel rounded-2xl border border-white/5 flex flex-col overflow-hidden z-10">
        {selectedPath ? (
          <>
            {/* Toolbar Header */}
            <div className="px-6 py-4 border-b border-gray-800/80 flex justify-between items-center bg-gray-900/30 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <FileCode className="w-5 h-5 text-indigo-400 shrink-0" />
                <div className="min-w-0">
                  <h3 className="text-xs font-mono font-semibold text-white truncate" title={selectedPath}>
                    {selectedPath.split('/').pop()}
                  </h3>
                  <span className="text-[10px] text-gray-500 font-mono truncate block" title={selectedPath}>
                    {selectedPath} • {getLanguageFromPath(selectedPath)}
                  </span>
                </div>
              </div>
              <button
                onClick={handleCopy}
                disabled={isLoading || error}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-800 hover:border-indigo-600/40 bg-gray-900/60 hover:bg-indigo-600/10 text-xs font-medium text-gray-400 hover:text-indigo-300 transition-all duration-200"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            {/* Content Container */}
            <div className="flex-1 overflow-hidden p-6 relative">
              {isLoading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                    <span className="text-xs text-gray-500 font-medium">Loading file content...</span>
                  </div>
                </div>
              ) : error ? (
                <div className="h-full flex items-center justify-center text-center p-6 text-red-400 text-sm">
                  {error}
                </div>
              ) : (
                <div className="h-full">
                  <CodeViewer filename={selectedPath} content={fileContent} />
                </div>
              )}
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-500 gap-4 p-8">
            <div className="w-16 h-16 rounded-full bg-gray-900 flex items-center justify-center border border-gray-800/80">
              <FileCode className="w-8 h-8 text-gray-700" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-400">No file selected</h3>
              <p className="text-xs text-gray-600 mt-1 max-w-xs mx-auto">
                Explore the repository file tree on the left and select any text file to view its source code.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeExplorerView;
