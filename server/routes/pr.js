const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/requireAuth');
const GitHubService = require('../services/githubService');

// POST /api/pr/create
router.post('/create', requireAuth, async (req, res) => {
  const { owner, repo, issueNumber, issueTitle, codeFix, explanation } = req.body;

  if (!owner || !repo || !issueNumber || !codeFix?.length) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const token = req.user.getAccessToken(); // ✅ decrypt
  console.log('Creating PR with token:', token.substring(0, 20) + '...');
  const branchName = `fix/issue-${issueNumber}-${Date.now()}`;

  try {
    // 1. Get default branch SHA
    const { sha, branch: baseBranch } = await GitHubService.getDefaultBranchSha(token, owner, repo);

    // 2. Create a new branch
    await GitHubService.createBranch(token, owner, repo, branchName, sha);

    // 3. Apply each code fix via Contents API
    for (const fix of codeFix) {
      if (!fix.filename || !fix.after) continue;

      let fileSha;
      try {
        const existing = await GitHubService.getFileContents(token, owner, repo, fix.filename);
        fileSha = existing.sha;
      } catch {
        // File doesn't exist yet — create it
        fileSha = undefined;
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
    }

    // 4. Create the Pull Request
    const pr = await GitHubService.createPullRequest(token, owner, repo, {
      title: `fix: resolve issue #${issueNumber} — ${issueTitle}`,
      body: `## AI-Generated Fix for #${issueNumber}\n\n${explanation || ''}\n\nCloses #${issueNumber}`,
      head: branchName,
      base: baseBranch,
    });

    res.json({ prUrl: pr.html_url, prNumber: pr.number });
  } catch (err) {
    console.error('Failed to create PR:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to create PR', detail: err.message });
  }
});

module.exports = router;
