import { useNavigate } from 'react-router-dom';

const confidenceColors = {
  high: 'badge-green',
  medium: 'badge-yellow',
  low: 'badge-red',
};

export default function IssueCard({ issue }) {
  const navigate = useNavigate();

  // Parse owner/repo/number from issue URL
  // e.g. https://api.github.com/repos/owner/repo/issues/42
  const urlParts = issue.url?.match(/repos\/([^/]+)\/([^/]+)\/issues\/(\d+)/);
  const owner = urlParts?.[1];
  const repo = urlParts?.[2];
  const number = urlParts?.[3];

  const handleResolve = () => {
    if (owner && repo && number) {
      navigate(`/issue/${owner}/${repo}/${number}`);
    }
  };

  const repoName = issue.repository_url?.split('/').slice(-2).join('/') || 'Unknown repo';
  const createdAt = new Date(issue.created_at).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  return (
    <div className="card p-4 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Repo + issue number */}
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-mono text-gray-400 dark:text-gray-500">{repoName}</span>
            <span className="text-xs text-gray-300 dark:text-gray-600">•</span>
            <span className="text-xs text-gray-400">#{issue.number}</span>
          </div>

          {/* Title */}
          <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate mb-2">
            {issue.title}
          </h3>

          {/* Labels */}
          {issue.labels?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {issue.labels.slice(0, 4).map((label) => (
                <span
                  key={label.id}
                  className="px-2 py-0.5 rounded-full text-xs font-medium"
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
          )}

          {/* Meta */}
          <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
            <span>Opened {createdAt}</span>
            <span>by @{issue.user?.login}</span>
            {issue.comments > 0 && (
              <span>{issue.comments} comment{issue.comments !== 1 ? 's' : ''}</span>
            )}
          </div>
        </div>

        {/* Action */}
        <button
          onClick={handleResolve}
          disabled={!owner}
          className="btn-primary text-xs px-3 py-1.5 flex-shrink-0"
        >
          Resolve with AI
        </button>
      </div>
    </div>
  );
}
