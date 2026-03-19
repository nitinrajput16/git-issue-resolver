import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import IssueCard from '../components/IssueCard';
import { useAuth } from '../hooks/useAuth';

const STATES = ['open', 'closed', 'all'];

function SkeletonCard() {
  return (
    <div className="card p-4 animate-pulse">
      <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-32 mb-3" />
      <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4 mb-3" />
      <div className="flex gap-2 mb-3">
        <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded-full w-16" />
        <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded-full w-20" />
      </div>
      <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-48" />
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [state, setState] = useState('open');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [manualUrl, setManualUrl] = useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['issues', state, page],
    queryFn: () =>
      api.get(`/issues?state=${state}&page=${page}`).then((r) => r.data),
    keepPreviousData: true,
  });

  const issues = data?.issues || [];
  const filtered = issues.filter((issue) =>
    issue.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleManualUrl = () => {
    const match = manualUrl.match(/github\.com\/([^/]+)\/([^/]+)\/issues\/(\d+)/);
    if (match) {
      navigate(`/issue/${match[1]}/${match[2]}/${match[3]}`);
    } else {
      alert('Invalid GitHub issue URL. Format: https://github.com/owner/repo/issues/42');
    }
  };

  const handleStateChange = (s) => {
    setState(s);
    setPage(1); // reset to page 1 on filter change
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
          Welcome back, {user?.displayName || user?.username} 👋
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Your GitHub issues — click any to resolve with AI.
        </p>
      </div>

      {/* Manual URL input */}
      <div className="card p-4">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
          Paste any GitHub issue URL
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="https://github.com/owner/repo/issues/42"
            value={manualUrl}
            onChange={(e) => setManualUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleManualUrl()}
            className="flex-1 text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button onClick={handleManualUrl} className="btn-primary">
            Load Issue
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {STATES.map((s) => (
            <button
              key={s}
              onClick={() => handleStateChange(s)}
              className={`px-3 py-1.5 text-sm capitalize transition-colors ${
                state === s
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Search issues…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-40 text-sm px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        {data && (
          <span className="text-xs text-gray-400">
            {filtered.length} issue{filtered.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Issue list */}
      {isLoading && (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {isError && (
        <div className="card p-8 text-center">
          <p className="text-red-500 font-medium">Failed to load issues.</p>
          <p className="text-sm text-gray-400 mt-1">Check your GitHub connection and try again.</p>
        </div>
      )}

      {!isLoading && !isError && filtered.length === 0 && (
        <div className="card p-12 text-center">
          <p className="text-2xl mb-2">🎉</p>
          <p className="font-medium text-gray-700 dark:text-gray-300">No issues found</p>
          <p className="text-sm text-gray-400 mt-1">
            {search ? 'Try a different search term.' : `No ${state} issues assigned to you.`}
          </p>
        </div>
      )}

      {!isLoading && !isError && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((issue) => (
            <IssueCard key={issue.id} issue={issue} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && !isError && (
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn-secondary text-sm disabled:opacity-40"
          >
            ← Previous
          </button>
          <span className="text-sm text-gray-400">Page {page}</span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={issues.length < 25}
            className="btn-secondary text-sm disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
