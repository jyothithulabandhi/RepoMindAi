import React from 'react';
import { LayoutDashboard, FileText, MessageSquare, FolderGit2, ArrowLeft, Terminal, Cpu } from 'lucide-react';

const Sidebar = ({ repoName, activeTab, setActiveTab, onReset, techStack }) => {
  const navItems = [
    { id: 'summary', name: 'Dashboard Summary', icon: LayoutDashboard },
    { id: 'explorer', name: 'File Explorer', icon: FolderGit2 },
    { id: 'readme', name: 'README Generator', icon: FileText },
    { id: 'chat', name: 'RAG Chat AI', icon: MessageSquare },
  ];

  const totalFiles = techStack?.total_files || 0;
  const totalSize = techStack?.total_size_bytes || 0;
  const primaryLang = techStack?.languages?.[0]?.language || 'Unknown';

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="w-80 h-full glass-panel border-r border-gray-800 flex flex-col justify-between select-none z-10 shrink-0">
      {/* Brand Header */}
      <div className="p-6 border-b border-gray-800/80">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30 ring-2 ring-indigo-400/20">
            <Cpu className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg text-white font-sans tracking-wide leading-none">RepoMind AI</h1>
            <span className="text-xs text-indigo-400 font-semibold tracking-wider uppercase">Codebase Assistant</span>
          </div>
        </div>

        {/* Current Repository Name */}
        <div className="p-3 bg-gray-900/60 rounded-xl border border-gray-800/80 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-indigo-400 shrink-0" />
          <span className="text-xs text-gray-300 font-mono font-medium truncate flex-1" title={repoName}>
            {repoName || 'unknown/repository'}
          </span>
        </div>
      </div>

      {/* Navigation Options */}
      <div className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 font-semibold translate-x-1'
                  : 'text-gray-400 hover:bg-gray-800/40 hover:text-gray-100 hover:translate-x-0.5'
              }`}
            >
              <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-indigo-400/80 group-hover:text-indigo-300'}`} />
              <span>{item.name}</span>
            </button>
          );
        })}
      </div>

      {/* Repo Stats and Return Button */}
      <div className="p-6 border-t border-gray-800/80 space-y-5">
        {/* Repo Statistics */}
        {techStack && (
          <div className="space-y-2 p-3 bg-gray-900/40 rounded-xl border border-gray-800/50 text-xs">
            <h3 className="font-bold text-gray-400 uppercase tracking-wider text-[10px] mb-2">Repository Stats</h3>
            <div className="flex justify-between">
              <span className="text-gray-500">Language:</span>
              <span className="text-gray-300 font-medium">{primaryLang}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Total Files:</span>
              <span className="text-gray-300 font-medium">{totalFiles}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Repository Size:</span>
              <span className="text-gray-300 font-medium">{formatBytes(totalSize)}</span>
            </div>
          </div>
        )}

        {/* Back Button */}
        <button
          onClick={onReset}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-800 hover:border-indigo-600/40 hover:bg-indigo-600/10 text-xs text-gray-400 hover:text-indigo-300 font-medium transition-all duration-200"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Analyze Another Project</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
