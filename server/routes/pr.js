const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/requireAuth');
const GitHubService = require('../services/githubService');

// Input validation helper
function validateRepoName(name) {
  // GitHub repo names: alphanumeric, hyphens, underscores, dots (no spaces, no special chars)
  return /^[a-zA-Z0-9._-]+$/.test(name);
}

function validateFilename(path) {
  // No absolute paths, no directory traversal
  if (!path || path.startsWith('/') || path.startsWith('\\')) return false;
  if (path.includes('..') || path.includes('~')) return false;
  // Allow common file path characters
  return /^[a-zA-Z0-9._\/\\-]+$/.test(path);
}

// POST /api/pr/create
router.post('/create', requireAuth, async (req, res) => {
  const { owner, repo, issueNumber, issueTitle, codeFix, explanation } = req.body;

  // Comprehensive input validation
  if (!owner || !repo || !issueNumber || !codeFix?.length) {
    return res.status(400).json({ error: 'Missing required fields: owner, repo, issueNumber, codeFix' });
  }

  // Validate owner and repo names (GitHub safe characters)
  if (!validateRepoName(owner) || !validateRepoName(repo)) {
    return res.status(400).json({ error: 'Invalid owner or repo name' });
  }

  // Validate issue number is positive integer
  if (!Number.isInteger(issueNumber) || issueNumber <= 0) {
    return res.status(400).json({ error: 'Invalid issue number' });
  }

  // Validate codeFix array structure
  if (!Array.isArray(codeFix)) {
    return res.status(400).json({ error: 'codeFix must be an array' });
  }

  // Validate each file fix
  for (const fix of codeFix) {
    if (!fix.filename || !fix.after) {
      return res.status(400).json({ error: 'Each codeFix must have filename and after' });
    }
    if (!validateFilename(fix.filename)) {
      return res.status(400).json({ error: `Invalid filename: ${fix.filename}` });
    }
  }

  const token = req.user.getAccessToken(); // ✅ decrypt
  console.log('Creating PR with token:', token.substring(0, 20) + '...');
  const branchName = `fix/issue-${issueNumber}-${Date.now()}`;

  try {
    // 1. Get default branch SHA
    console.log('Getting default branch for', owner, repo);
    const { sha, branch: baseBranch } = await GitHubService.getDefaultBranchSha(token, owner, repo);

    // 2. Create a new branch
    console.log('Creating branch:', branchName);
    await GitHubService.createBranch(token, owner, repo, branchName, sha);

    // 3. Apply each code fix via Contents API
    for (const fix of codeFix) {
      console.log('Processing file:', fix.filename);
      let fileSha;
      try {
        const existing = await GitHubService.getFileContents(token, owner, repo, fix.filename);
        fileSha = existing.sha;
        console.log('File exists, updating with SHA:', fileSha.substring(0, 20) + '...');
      } catch (err) {
        if (err.response?.status !== 404) {
          console.error('Failed to fetch file:', err.response?.data || err.message);
          throw err;
        }
        // File doesn't exist yet — create it
        fileSha = undefined;
        console.log('File does not exist, will create new');
      }

      await GitHubService.createOrUpdateFile(
        token,
        owner,
        repo,
        fix.filename,
        fix.after,
        `fix: apply AI suggestion for issue #${issueNumber}`,
        fileSha
      );
      console.log('File updated successfully:', fix.filename);
    }

    // 4. Create the Pull Request
    console.log('Creating pull request');
    const pr = await GitHubService.createPullRequest(token, owner, repo, {
      title: `fix: resolve issue #${issueNumber} — ${issueTitle}`,
      body: `## AI-Generated Fix for #${issueNumber}\n\n${explanation || ''}\n\nCloses #${issueNumber}`,
      head: branchName,
      base: baseBranch,
    });

    console.log('PR created successfully:', pr.html_url);
    res.json({ prUrl: pr.html_url, prNumber: pr.number });
  } catch (err) {
    console.error('Failed to create PR:', {
      status: err.response?.status,
      data: err.response?.data,
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });

    // Don't leak internal error details in production
    const isDev = process.env.NODE_ENV !== 'production';
    const errorMessage = 'Failed to create PR';
    const errorDetail = isDev 
      ? (err.response?.data?.message || err.message)
      : 'Please check your permissions and try again';

    res.status(500).json({
      error: errorMessage,
      ...(isDev && { detail: errorDetail })
    });
  }
});

module.exports = router;
