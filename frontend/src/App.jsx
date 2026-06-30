import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import HomeView from './components/HomeView';
import DashboardView from './components/DashboardView';
import CodeExplorerView from './components/CodeExplorerView';
import ChatView from './components/ChatView';

function App() {
  const [repositoryId, setRepositoryId] = useState('');
  const [repoName, setRepoName] = useState('');
  const [summary, setSummary] = useState(null);
  const [techStack, setTechStack] = useState(null);
  const [fileTree, setFileTree] = useState([]);
  const [readmeContent, setReadmeContent] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('summary');

  const handleAnalyze = async (url) => {
    setIsLoading(true);
    setError('');
    
    try {
      // 1. Trigger backend analysis
      const res = await fetch('/api/analyze-repository', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repo_url: url })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Analysis failed. Make sure the repository is public and contains code.');
      }

      const data = await res.json();
      const repoId = data.repository_id;

      // 2. Fetch full repository details (tree structure, stack details)
      const detailsRes = await fetch(`/api/repository/${repoId}`);
      if (!detailsRes.ok) {
        throw new Error('Failed to load analysis details.');
      }
      const details = await detailsRes.json();

      // 3. Fetch pre-generated README
      const readmeRes = await fetch(`/api/readme/${repoId}`);
      if (!readmeRes.ok) {
        throw new Error('Failed to fetch pre-generated README.');
      }
      const readmeText = await readmeRes.text();

      // 4. Commit states
      setRepositoryId(repoId);
      setRepoName(details.repo_name);
      setSummary(details.summary);
      setTechStack(details.tech_stack);
      setFileTree(details.file_tree);
      setReadmeContent(readmeText);
      setActiveTab('summary');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Analysis encountered an error.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setRepositoryId('');
    setRepoName('');
    setSummary(null);
    setTechStack(null);
    setFileTree([]);
    setReadmeContent('');
    setError('');
    setActiveTab('summary');
  };

  // Render correct panel content based on current active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'summary':
      case 'readme':
        return (
          <DashboardView
            activeTab={activeTab}
            summary={summary}
            techStack={techStack}
            readmeContent={readmeContent}
          />
        );
      case 'explorer':
        return (
          <CodeExplorerView
            repositoryId={repositoryId}
            fileTree={fileTree}
          />
        );
      case 'chat':
        return (
          <ChatView
            repositoryId={repositoryId}
            repoName={repoName}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-screen h-screen flex bg-slate-950 font-sans overflow-hidden text-gray-100">
      {repositoryId ? (
        /* Authenticated Dashboard View */
        <div className="w-full h-full flex overflow-hidden">
          <Sidebar
            repoName={repoName}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onReset={handleReset}
            techStack={techStack}
          />
          <main className="flex-1 h-full overflow-hidden">
            {renderContent()}
          </main>
        </div>
      ) : (
        /* Home Landing View */
        <HomeView
          onAnalyze={handleAnalyze}
          isLoading={isLoading}
          error={error}
        />
      )}
    </div>
  );
}

export default App;
