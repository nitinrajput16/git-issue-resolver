import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';
import api from '../lib/api';
import ResolutionPanel from '../components/ResolutionPanel';
import ErrorBoundary from '../components/ErrorBoundary';

// Fixed widths — no random recalculation on re-render
const SKELETON_WIDTHS = ['75%', '90%', '60%', '85%', '70%'];

function Skeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-2/3" />
      <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/3" />
      <div className="card p-5 space-y-3">
        {SKELETON_WIDTHS.map((w, i) => (
          <div key={i} className="h-4 bg-gray-200 dark:bg-gray-800 rounded" style={{ width: w }} />
        ))}
      </div>
    </div>
  );
}

export default function IssuePage() {
  const { owner, repo, number } = useParams();
  const queryClient = useQueryClient();
  const cacheKey = ['resolution', owner, repo, number];

  // Persist resolution in query cache — survives navigation away and back
  const cachedResolution = queryClient.getQueryData(cacheKey);
  const [resolutionMeta, setResolutionMeta] = useState(
    cachedResolution || null
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: ['issue', owner, repo, number],
    queryFn: () => api.get(`/issues/${owner}/${repo}/${number}`).then((r) => r.data),
  });

  const resolveMutation = useMutation({
    mutationFn: (force = false) =>
      api
        .post('/resolve', { owner, repo, issueNumber: parseInt(number), force })
        .then((r) => r.data),
    onSuccess: (data) => {
      setResolutionMeta(data);
      queryClient.setQueryData(cacheKey, data); // persist in cache
      toast.success(data.cached ? 'Loaded cached resolution' : 'Issue analyzed!');
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || 'AI resolution failed');
    },
  });

  if (isLoading) return <Skeleton />;
  if (isError)
    return (
      <div className="card p-8 text-center">
        <p className="text-red-500 font-medium">Failed to load issue.</p>
        <Link to="/dashboard" className="text-sm text-indigo-600 mt-2 inline-block">
          ← Back to dashboard
        </Link>
      </div>
    );

  const { issue, comments } = data;
  const createdAt = new Date(issue.created_at).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <Link to="/dashboard" className="hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
          Dashboard
        </Link>
        <span>/</span>
        <span className="font-mono">{owner}/{repo}</span>
        <span>/</span>
        <span>#{number}</span>
      </div>

      {/* Issue header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{issue.title}</h1>
        <div className="flex flex-wrap items-center gap-3">
          <span className={`badge ${issue.state === 'open' ? 'badge-green' : 'badge-gray'}`}>
            {issue.state}
          </span>
          <span className="text-xs text-gray-400">
            opened {createdAt} by @{issue.user?.login}
          </span>
          {issue.labels?.map((label) => (
            <span
              key={label.id}
              className="px-2 py-0.5 rounded-full text-xs"
              style={{
                backgroundColor: `#${label.color}22`,
                color: `#${label.color}`,
                border: `1px solid #${label.color}44`,
              }}
            >
              {label.name}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: issue body + comments */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100 dark:border-gray-800">
              <img src={issue.user?.avatar_url} alt={issue.user?.login} className="w-6 h-6 rounded-full" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                @{issue.user?.login}
              </span>
            </div>
            {issue.body ? (
              <div className="prose prose-sm dark:prose-invert max-w-none text-sm">
                <ReactMarkdown>{issue.body}</ReactMarkdown>
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">No description provided.</p>
            )}
          </div>

          {comments?.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                {comments.length} Comment{comments.length !== 1 ? 's' : ''}
              </p>
              {comments.map((comment) => (
                <div key={comment.id} className="card p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <img
                      src={comment.user?.avatar_url}
                      alt={comment.user?.login}
                      className="w-5 h-5 rounded-full"
                    />
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      @{comment.user?.login}
                    </span>
                    <span className="text-xs text-gray-300 dark:text-gray-600">
                      {new Date(comment.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="prose prose-sm dark:prose-invert max-w-none text-sm">
                    <ReactMarkdown>{comment.body}</ReactMarkdown>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: resolve panel */}
        <div className="space-y-4">
          {!resolutionMeta && (
            <div className="card p-5 text-center space-y-3">
              <div className="text-3xl">🤖</div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Ready to resolve</p>
              <p className="text-xs text-gray-400">
                AI will analyze the issue, comments, and code context to generate a fix.
              </p>
              <button
                onClick={() => resolveMutation.mutate(false)}
                disabled={resolveMutation.isPending}
                className="btn-primary w-full justify-center"
              >
                {resolveMutation.isPending ? (
                  <>
                    <span className="animate-spin inline-block">⏳</span> Analyzing…
                  </>
                ) : (
                  'Resolve Issue with AI'
                )}
              </button>
            </div>
          )}

          {resolutionMeta && (
            <ErrorBoundary>
              <ResolutionPanel
                resolution={resolutionMeta.resolution}
                owner={owner}
                repo={repo}
                issueNumber={parseInt(number)}
                issueTitle={issue.title}
                cached={resolutionMeta.cached}
                onResolveAgain={() => resolveMutation.mutate(true)}
                onClose={() => {
                  setResolutionMeta(null);
                  queryClient.removeQueries(cacheKey);
                }}
              />
            </ErrorBoundary>
          )}
        </div>
      </div>
    </div>
  );
}
