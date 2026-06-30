import React, { useState, useEffect } from 'react';
import { Cpu, ArrowRight, AlertTriangle, Loader2 } from 'lucide-react';

const HomeView = ({ onAnalyze, isLoading, error }) => {
  const [repoUrl, setRepoUrl] = useState('');
  const [localError, setLocalError] = useState('');
  const [loadingStep, setLoadingStep] = useState(0);

  const sampleRepos = [
    { name: 'FastAPI', url: 'https://github.com/fastapi/fastapi' },
    { name: 'Flask', url: 'https://github.com/pallets/flask' },
    { name: 'Request', url: 'https://github.com/psf/requests' }
  ];

  const loadingSteps = [
    'Connecting to GitHub & validating URL...',
    'Cloning repository into temporary workspace (shallow clone)...',
    'Analyzing folder structure & identifying tech stack...',
    'Splitting code files into optimized semantic chunks...',
    'Generating vector embeddings (ChromaDB or NumPy Store)...',
    'Synthesizing codebase overview, folders & modules with AI...',
    'Drafting a professional markdown README.md...',
    'Caching repository metadata for subsecond loading...'
  ];

  // Rotate loading steps while analysis is running
  useEffect(() => {
    let interval;
    if (isLoading) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep((prev) => {
          if (prev < loadingSteps.length - 1) {
            return prev + 1;
          }
          return prev; // hold on last step
        });
      }, 3500);
    } else {
      setLoadingStep(0);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLocalError('');
    
    const trimmed = repoUrl.trim();
    if (!trimmed) {
      setLocalError('Please enter a Git repository URL.');
      return;
    }

    // Git URL validation
    const gitPattern = /^(https:\/\/|http:\/\/|git@)(github\.com|gitlab\.com|bitbucket\.org|[\w\.-]+)\/[\w\.-]+\/[\w\.-]+(?:\.git|\/)?$/;
    if (!gitPattern.test(trimmed)) {
      setLocalError('Please enter a valid Git URL. E.g. https://github.com/user/repo');
      return;
    }

    onAnalyze(trimmed);
  };

  const handleSampleClick = (url) => {
    setRepoUrl(url);
    setLocalError('');
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-6 bg-slate-950 overflow-hidden">
      {/* Dynamic Animated Glows */}
      <div className="bg-glow top-1/4 left-1/4 animate-pulse-slow"></div>
      <div className="bg-glow bottom-1/4 right-1/4 animation-delay-2000 animate-pulse"></div>

      <div className="w-full max-w-2xl z-10">
        {!isLoading ? (
          <div className="glass-panel p-10 rounded-3xl shadow-2xl border border-white/10 flex flex-col items-center text-center space-y-8">
            {/* Logo */}
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center shadow-2xl shadow-indigo-600/40 transform hover:rotate-6 transition-transform duration-300">
              <Cpu className="w-12 h-12 text-white" />
            </div>

            {/* Title */}
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight font-sans">
                Repo<span className="text-indigo-400">Mind</span> AI
              </h1>
              <p className="mt-3 text-gray-400 max-w-md mx-auto text-sm leading-relaxed">
                Analyze public Git repositories instantly. Get AI-generated summaries, professional READMEs, and ask codebase questions using RAG.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="w-full max-w-xl space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 items-stretch">
                <div className="relative flex-1 flex items-center">
                  <div className="absolute left-4 text-gray-500">
                    <svg
                      viewBox="0 0 24 24"
                      className="w-5 h-5 text-gray-500 shrink-0"
                      stroke="currentColor"
                      strokeWidth="2"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Paste GitHub Repository URL... (e.g. https://github.com/user/repo)"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 rounded-2xl glass-input text-white text-sm placeholder-gray-500 font-mono shadow-inner"
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-4 rounded-2xl bg-indigo-650 hover:bg-indigo-600 text-white font-semibold text-sm flex items-center justify-center gap-1.5 transition-all duration-200 hover:shadow-lg hover:shadow-indigo-600/30 shrink-0 cursor-pointer"
                >
                  <span>Analyze Codebase</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Error messages */}
              {(localError || error) && (
                <div className="p-4 bg-red-900/30 border border-red-500/30 rounded-2xl flex items-start gap-3 text-left">
                  <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-200 leading-normal">{localError || error}</p>
                </div>
              )}
            </form>

            {/* Quick Demo Options */}
            <div className="pt-2 border-t border-gray-800/80 w-full">
              <span className="text-xs text-gray-500 font-medium">Try a sample repository:</span>
              <div className="mt-3 flex flex-wrap justify-center gap-2.5">
                {sampleRepos.map((repo) => (
                  <button
                    key={repo.name}
                    onClick={() => handleSampleClick(repo.url)}
                    className="px-3.5 py-1.5 rounded-lg bg-gray-900/80 hover:bg-indigo-900/20 border border-gray-800 hover:border-indigo-600/40 text-xs text-gray-400 hover:text-indigo-300 font-medium transition-all duration-150"
                  >
                    {repo.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Loading View */
          <div className="glass-panel p-12 rounded-3xl border border-indigo-500/20 shadow-2xl flex flex-col items-center justify-center text-center space-y-8">
            <div className="relative flex items-center justify-center">
              <div className="w-24 h-24 rounded-full border-4 border-indigo-500/10 border-t-indigo-500 animate-spin"></div>
              <Cpu className="absolute w-10 h-10 text-indigo-400 animate-pulse" />
            </div>

            <div className="space-y-3">
              <h2 className="text-xl font-bold text-white tracking-wide">Analyzing Repository</h2>
              <p className="text-xs text-gray-500">Please wait. This can take up to a minute for larger projects.</p>
            </div>

            {/* Process Checklist */}
            <div className="w-full max-w-md bg-gray-950/60 p-6 rounded-2xl border border-gray-900 text-left font-mono space-y-2.5 text-xs text-gray-400">
              {loadingSteps.map((step, idx) => {
                const isCompleted = idx < loadingStep;
                const isCurrent = idx === loadingStep;
                return (
                  <div key={idx} className="flex items-center gap-2.5">
                    {isCompleted ? (
                      <span className="text-green-500 font-bold">✓</span>
                    ) : isCurrent ? (
                      <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin shrink-0" />
                    ) : (
                      <span className="text-gray-700 font-bold">○</span>
                    )}
                    <span className={isCompleted ? 'text-gray-500 line-through' : isCurrent ? 'text-indigo-200 font-bold' : 'text-gray-600'}>
                      {step}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomeView;
