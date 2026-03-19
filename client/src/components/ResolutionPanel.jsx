import { useState } from 'react';
import ReactDiffViewer from 'react-diff-viewer-continued';
import toast from 'react-hot-toast';
import api from '../lib/api';

const confidenceBadge = {
  high: 'badge-green',
  medium: 'badge-yellow',
  low: 'badge-red',
};

export default function ResolutionPanel({ resolution, owner, repo, issueNumber, issueTitle, onClose }) {
  const [creating, setCreating] = useState(false);
  const [prUrl, setPrUrl] = useState(null);

  const copyFix = () => {
    const text = resolution.codeFix
      .map((f) => `// ${f.filename}\n${f.after}`)
      .join('\n\n---\n\n');
    navigator.clipboard.writeText(text || resolution.explanation);
    toast.success('Copied to clipboard');
  };

  const createPr = async () => {
    setCreating(true);
    try {
      const { data } = await api.post('/pr/create', {
        owner, repo, issueNumber,
        issueTitle,
        codeFix: resolution.codeFix,
        explanation: resolution.explanation,
      });
      setPrUrl(data.prUrl);
      toast.success('Pull request created!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create PR');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-medium text-gray-900 dark:text-white">AI Resolution</span>
          <span className={confidenceBadge[resolution.confidence] || 'badge-gray'}>
            {resolution.confidence} confidence
          </span>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-lg leading-none">×</button>
      </div>

      <div className="p-5 space-y-6">
        {/* Low confidence warning */}
        {resolution.confidence === 'low' && (
          <div className="flex gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <span className="text-yellow-500 flex-shrink-0">⚠️</span>
            <p className="text-sm text-yellow-700 dark:text-yellow-400">
              Low confidence — the AI couldn't fully identify the root cause. Review carefully before applying.
            </p>
          </div>
        )}

        {/* Root cause */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">🔍 Root Cause</h3>
          <div className="p-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-lg">
            <p className="text-sm text-gray-800 dark:text-gray-200">{resolution.rootCause}</p>
          </div>
        </div>

        {/* Steps */}
        {resolution.steps?.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">📋 Steps to Fix</h3>
            <ol className="space-y-2">
              {resolution.steps.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm text-gray-700 dark:text-gray-300">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-medium">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Code diff */}
        {resolution.codeFix?.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">💻 Code Fix</h3>
            <div className="space-y-4">
              {resolution.codeFix.map((fix, i) => (
                <div key={i} className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                  <div className="px-3 py-2 bg-gray-100 dark:bg-gray-800 text-xs font-mono text-gray-500 dark:text-gray-400">
                    {fix.filename}
                  </div>
                  <ReactDiffViewer
                    oldValue={fix.before || ''}
                    newValue={fix.after || ''}
                    splitView={false}
                    useDarkTheme={document.documentElement.classList.contains('dark')}
                    hideLineNumbers={false}
                    styles={{
                      variables: {
                        light: { diffViewerBackground: '#fff', addedBackground: '#e6ffed', removedBackground: '#ffeef0' },
                        dark: { diffViewerBackground: '#111827', addedBackground: '#0d3a1e', removedBackground: '#3a0d0d' },
                      },
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Explanation */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">📝 Explanation</h3>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{resolution.explanation}</p>
        </div>

        {/* Suggested labels */}
        {resolution.suggestedLabels?.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">🏷 Suggested Labels</h3>
            <div className="flex flex-wrap gap-2">
              {resolution.suggestedLabels.map((label) => (
                <span key={label} className="badge-blue">{label}</span>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
          <button onClick={copyFix} className="btn-secondary">
            Copy Fix
          </button>

          {prUrl ? (
            <a href={prUrl} target="_blank" rel="noopener noreferrer" className="btn-primary">
              View Pull Request ↗
            </a>
          ) : (
            <button
              onClick={createPr}
              disabled={creating || !resolution.codeFix?.length}
              className="btn-primary"
              title={!resolution.codeFix?.length ? 'No code fix available to create a PR' : ''}
            >
              {creating ? 'Creating PR…' : 'Open PR with this Fix'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
