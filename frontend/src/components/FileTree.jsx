import React, { useState } from 'react';
import { Folder, FolderOpen, FileCode, FileText, ChevronRight, ChevronDown } from 'lucide-react';

const FileNode = ({ node, onFileSelect, selectedPath }) => {
  const [isOpen, setIsOpen] = useState(false);
  const isDirectory = node.type === 'directory';

  const handleToggle = (e) => {
    e.stopPropagation();
    if (isDirectory) {
      setIsOpen(!isOpen);
    } else if (onFileSelect) {
      onFileSelect(node.path);
    }
  };

  const getFileIcon = (lang) => {
    const l = lang?.toLowerCase();
    if (['javascript', 'typescript', 'python', 'go', 'rust', 'java', 'cpp', 'csharp', 'php', 'swift', 'ruby'].includes(l)) {
      return <FileCode className="w-4 h-4 text-indigo-400 mr-2 shrink-0" />;
    }
    return <FileText className="w-4 h-4 text-gray-400 mr-2 shrink-0" />;
  };

  const formatSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const isSelected = selectedPath === node.path;

  return (
    <div className="select-none">
      <div
        onClick={handleToggle}
        className={`flex items-center py-1.5 px-2 rounded-md cursor-pointer transition-colors duration-150 text-sm ${
          isSelected
            ? 'bg-indigo-600/30 text-indigo-200 border-l-2 border-indigo-500'
            : 'hover:bg-gray-800/50 text-gray-300 hover:text-gray-100'
        }`}
        style={{ paddingLeft: `${node.depth * 12 + 8}px` }}
      >
        {isDirectory ? (
          <>
            <span className="text-gray-500 mr-1">
              {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </span>
            {isOpen ? (
              <FolderOpen className="w-4 h-4 text-brand-400 mr-2 shrink-0" />
            ) : (
              <Folder className="w-4 h-4 text-brand-500 mr-2 shrink-0" />
            )}
            <span className="font-medium truncate">{node.name}</span>
          </>
        ) : (
          <>
            <span className="w-4 mr-1"></span>
            {getFileIcon(node.language)}
            <span className="truncate flex-1">{node.name}</span>
            <span className="text-xs text-gray-500 ml-2 shrink-0">{formatSize(node.size)}</span>
          </>
        )}
      </div>

      {isDirectory && isOpen && node.children && (
        <div className="mt-0.5">
          {node.children.map((child, idx) => (
            <FileNode
              key={`${child.path}-${idx}`}
              node={{ ...child, depth: (node.depth || 0) + 1 }}
              onFileSelect={onFileSelect}
              selectedPath={selectedPath}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const FileTree = ({ treeData, onFileSelect, selectedPath }) => {
  if (!treeData || treeData.length === 0) {
    return <div className="text-sm text-gray-500 italic p-4">No files found.</div>;
  }

  return (
    <div className="space-y-0.5 overflow-y-auto max-h-[100%] pr-1">
      {treeData.map((node, idx) => (
        <FileNode
          key={`${node.path}-${idx}`}
          node={{ ...node, depth: 0 }}
          onFileSelect={onFileSelect}
          selectedPath={selectedPath}
        />
      ))}
    </div>
  );
};

export default FileTree;
