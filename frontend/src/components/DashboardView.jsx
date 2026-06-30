import React, { useState } from 'react';
import { Copy, Download, Check, FileText, Blocks, Info, FolderCheck, Cpu } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';

const DashboardView = ({ activeTab, summary, techStack, readmeContent }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!readmeContent) return;
    navigator.clipboard.writeText(readmeContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!readmeContent) return;
    const blob = new Blob([readmeContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'README.md');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (activeTab === 'readme') {
    return (
      <div className="w-full h-full flex flex-col bg-slate-950 p-8 overflow-hidden relative">
        <div className="bg-glow top-0 right-0 animate-pulse-slow"></div>
        
        {/* Header Options */}
        <div className="flex justify-between items-center mb-6 z-10 shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">README.md Generator</h2>
            <p className="text-xs text-gray-500 mt-1">Pre-generated standard markdown README.md based on analysis.</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleCopy}
              disabled={!readmeContent}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-800 hover:border-indigo-600/40 bg-gray-900/60 hover:bg-indigo-600/10 text-xs font-semibold text-gray-300 hover:text-indigo-200 transition-all duration-200"
            >
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied!' : 'Copy to Clipboard'}</span>
            </button>
            <button
              onClick={handleDownload}
              disabled={!readmeContent}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-all duration-200 hover:shadow-lg hover:shadow-indigo-600/30"
            >
              <Download className="w-4 h-4" />
              <span>Download README.md</span>
            </button>
          </div>
        </div>

        {/* Scrollable Document Container */}
        <div className="flex-1 glass-panel rounded-2xl border border-white/5 overflow-y-auto p-8 shadow-inner z-10">
          {readmeContent ? (
            <div className="max-w-4xl mx-auto">
              <MarkdownRenderer content={readmeContent} />
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 gap-3">
              <FileText className="w-12 h-12 text-gray-700 animate-pulse" />
              <p className="text-sm font-medium">README has not been generated.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Otherwise, render primary Dashboard Summary ('summary')
  return (
    <div className="w-full h-full flex flex-col bg-slate-950 p-8 overflow-hidden relative">
      <div className="bg-glow top-0 right-1/4 animate-pulse-slow"></div>

      {/* Title Header */}
      <div className="mb-8 z-10 shrink-0">
        <h2 className="text-2xl font-bold text-white tracking-tight">Analysis Dashboard</h2>
        <p className="text-xs text-gray-500 mt-1">AI-generated architectural analysis and metadata highlights.</p>
      </div>

      {/* Main Grid */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-6 z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Overview & Purpose Card */}
          <div className="lg:col-span-2 glass-card p-6 rounded-2xl flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-800/80">
              <Info className="w-5 h-5 text-indigo-400" />
              <h3 className="font-bold text-sm text-white uppercase tracking-wider">Project Overview</h3>
            </div>
            <div className="flex-1 min-h-[150px]">
              <MarkdownRenderer content={summary?.overview} />
            </div>
          </div>

          {/* Tech Stack Badge Cloud & Specs */}
          <div className="glass-card p-6 rounded-2xl flex flex-col gap-5">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-800/80">
              <Blocks className="w-5 h-5 text-indigo-400" />
              <h3 className="font-bold text-sm text-white uppercase tracking-wider">Technologies & Frameworks</h3>
            </div>
            
            {/* Languages Distribution */}
            {techStack?.languages && techStack.languages.length > 0 && (
              <div className="space-y-3">
                <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Languages</span>
                <div className="space-y-2">
                  {techStack.languages.slice(0, 4).map((lang) => (
                    <div key={lang.language} className="space-y-1">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-gray-300">{lang.language}</span>
                        <span className="text-gray-400 font-semibold">{lang.percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-900 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="bg-indigo-500 h-1.5 rounded-full" 
                          style={{ width: `${lang.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Framework Tags */}
            {techStack?.frameworks && techStack.frameworks.length > 0 && (
              <div className="space-y-3 pt-2">
                <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Libraries & Frameworks</span>
                <div className="flex flex-wrap gap-2">
                  {techStack.frameworks.map((fw) => (
                    <span 
                      key={fw} 
                      className="px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-xs font-medium text-indigo-300"
                    >
                      {fw}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Lower Grid: Folders and Modules */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Folders Card */}
          <div className="glass-card p-6 rounded-2xl flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-800/80">
              <FolderCheck className="w-5 h-5 text-indigo-400" />
              <h3 className="font-bold text-sm text-white uppercase tracking-wider">Folder Architecture</h3>
            </div>
            <div className="flex-1">
              <MarkdownRenderer content={summary?.folders} />
            </div>
          </div>

          {/* Key Modules Card */}
          <div className="glass-card p-6 rounded-2xl flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-800/80">
              <Cpu className="w-5 h-5 text-indigo-400" />
              <h3 className="font-bold text-sm text-white uppercase tracking-wider">Key Modules & Responsibilities</h3>
            </div>
            <div className="flex-1">
              <MarkdownRenderer content={summary?.key_modules} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
