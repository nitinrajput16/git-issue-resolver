import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../lib/api';
import ResolutionPanel from '../components/ResolutionPanel';
import ErrorBoundary from '../components/ErrorBoundary';

const confidenceBadge = {
  high: 'badge-green',
  medium: 'badge-yellow',
  low: 'badge-red',
};

function StatsRow({ resolutions }) {
  if (!resolutions?.length) return null;
  const total = resolutions.length;
  const high = resolutions.filter((r) => r.resolution?.confidence === 'high').length;
  const repos = new Set(resolutions.map((r) => r.repo)).size;
  const pct = Math.round((high / total) * 100);

  return (
    <div className="grid grid-cols-3 gap-3">
      {[
        { label: 'Total resolved', value: total },
        { label: 'High confidence', value: `${pct}%` },
        { label: 'Repos covered', value: repos },
      ].map(({ label, value }) => (
        <div key={label} className="card p-4 text-center">
          <p className="text-2xl font-semibold text-gray-900 dark:text-white">{value}</p>
          <p className="text-xs text-gray-400 mt-1">{label}</p>
        </div>
      ))}
    </div>
  );
}

export default function History() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [confidence, setConfidence] = useState('');
  const [viewing, setViewing] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['history', search, confidence],
    queryFn: () =>
      api.get('/history', { params: { search, confidence } }).then((r) => r.data.resolutions),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/history/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['history']);
      toast.success('Deleted');
    },
    onError: () => toast.error('Delete failed'),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Resolution History</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">All AI resolutions you've run.</p>
      </div>

      {/* Stats */}
      <StatsRow resolutions={data} />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="Search by issue title…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-48 text-sm px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <select
          value={confidence}
          onChange={(e) => setConfidence(e.target.value)}
          className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none"
        >
          <option value="">All confidence</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* List */}
      {isLoading && (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-4 animate-pulse h-20" />
          ))}
        </div>
      )}

      {!isLoading && (!data || data.length === 0) && (
        <div className="card p-12 text-center">
          <p className="text-2xl mb-2">📭</p>
          <p className="font-medium text-gray-700 dark:text-gray-300">No resolutions yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Go to the{' '}
            <Link to="/dashboard" className="text-indigo-600">
              dashboard
            </Link>{' '}
            to resolve your first issue.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {data?.map((item) => (
          <div key={item._id} className="card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-gray-400">
                    {item.owner}/{item.repo} #{item.issueNumber}
                  </span>
                  <span className={confidenceBadge[item.resolution?.confidence] || 'badge-gray'}>
                    {item.resolution?.confidence}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {item.issueTitle}
                </p>
                <div className="flex gap-3 mt-1 text-xs text-gray-400">
                  <span>Model: {item.model}</span>
                  <span>
                    {new Date(item.createdAt).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => setViewing(viewing?._id === item._id ? null : item)}
                  className="btn-secondary text-xs px-3 py-1.5"
                >
                  {viewing?._id === item._id ? 'Close' : 'View Fix'}
                </button>
                <button
                  onClick={() => deleteMutation.mutate(item._id)}
                  className="btn-danger"
                >
                  Delete
                </button>
              </div>
            </div>

            {viewing?._id === item._id && item.resolution && (
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                <ErrorBoundary>
                  <ResolutionPanel
                    resolution={item.resolution}
                    owner={item.owner}
                    repo={item.repo}
                    issueNumber={item.issueNumber}
                    issueTitle={item.issueTitle}
                    onClose={() => setViewing(null)}
                  />
                </ErrorBoundary>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
