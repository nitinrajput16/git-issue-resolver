const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/requireAuth');
const GitHubService = require('../services/githubService');

// GET /api/issues
router.get('/', requireAuth, async (req, res) => {
  try {
    const { filter = 'all', state = 'open', page = 1 } = req.query;
    const token = req.user.getAccessToken(); // ✅ decrypt
    console.log('Fetching issues with token:', token.substring(0, 20) + '...');
    const issues = await GitHubService.getUserIssues(token, {
      filter,
      state,
      page: parseInt(page),
    });
    res.json({ issues, page: parseInt(page) });
  } catch (err) {
    console.error('Failed to fetch issues:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to fetch issues from GitHub' });
  }
});

// GET /api/issues/:owner/:repo/:number
router.get('/:owner/:repo/:number', requireAuth, async (req, res) => {
  const { owner, repo, number } = req.params;
  try {
    const token = req.user.getAccessToken(); // ✅ decrypt
    console.log('Fetching issue details with token:', token.substring(0, 20) + '...');
    const [issue, comments] = await Promise.all([
      GitHubService.getIssue(token, owner, repo, number),
      GitHubService.getIssueComments(token, owner, repo, number),
    ]);
    res.json({ issue, comments });
  } catch (err) {
    console.error('Failed to fetch issue details:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to fetch issue details' });
  }
});

// POST /api/issues/:owner/:repo/:number/labels
router.post('/:owner/:repo/:number/labels', requireAuth, async (req, res) => {
  const { owner, repo, number } = req.params;
  const { labels } = req.body;

  if (!Array.isArray(labels) || labels.length === 0) {
    return res.status(400).json({ error: 'labels must be a non-empty array' });
  }

  try {
    const token = req.user.getAccessToken(); // ✅ decrypt
    console.log('Applying labels with token:', token.substring(0, 20) + '...');
    const result = await GitHubService.applyLabels(token, owner, repo, number, labels);
    res.json({ labels: result });
  } catch (err) {
    console.error('Failed to apply labels:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to apply labels' });
  }
});

module.exports = router;
