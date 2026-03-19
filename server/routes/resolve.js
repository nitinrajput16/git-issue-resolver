const express = require('express');
const axios = require('axios'); // moved to top-level — not inside handler
const rateLimit = require('express-rate-limit');
const router = express.Router();
const { requireAuth } = require('../middleware/requireAuth');
const GitHubService = require('../services/githubService');
const AIService = require('../services/aiService');
const Resolution = require('../models/Resolution');

const resolveLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Too many resolve requests — please wait a minute.' },
  keyGenerator: (req) => req.user?._id?.toString() || req.ip,
});

// POST /api/resolve
router.post('/', requireAuth, resolveLimiter, async (req, res) => {
  const { owner, repo, issueNumber, additionalContext, force } = req.body;

  if (!owner || !repo || !issueNumber) {
    return res.status(400).json({ error: 'owner, repo, and issueNumber are required' });
  }

  try {
    const token = req.user.accessToken;

    // ── Duplicate check — skip AI if already resolved (unless force=true) ──
    if (!force) {
      const existing = await Resolution.findOne({
        userId: req.user._id,
        owner,
        repo,
        issueNumber: parseInt(issueNumber),
      }).sort({ createdAt: -1 });

      if (existing) {
        return res.json({
          resolution: existing.resolution,
          resolutionId: existing._id,
          cached: true,
        });
      }
    }

    // 1. Fetch issue + comments in parallel
    const [issue, comments] = await Promise.all([
      GitHubService.getIssue(token, owner, repo, issueNumber),
      GitHubService.getIssueComments(token, owner, repo, issueNumber),
    ]);

    // 2. Detect repo language
    let language = 'Unknown';
    try {
      const { data } = await axios.get(
        `https://api.github.com/repos/${owner}/${repo}`,
        { headers: { Authorization: `Bearer ${token}` }, timeout: 5000 }
      );
      language = data.language || 'Unknown';
    } catch (_) {}

    // 3. Extract code context from issue body
    let codeContext = additionalContext || '';
    const codeBlockMatch = issue.body?.match(/```[\s\S]*?```/g);
    if (codeBlockMatch) {
      codeContext = codeBlockMatch.join('\n\n').slice(0, 3000);
    }

    // 4. Call AI (with retry + timeout inside AIService)
    const resolution = await AIService.resolveIssue({
      issueTitle: issue.title,
      issueBody: issue.body,
      comments,
      codeContext,
      language,
      repoName: `${owner}/${repo}`,
    });

    // 5. Save to MongoDB
    const saved = await Resolution.create({
      userId: req.user._id,
      issueUrl: issue.html_url,
      owner,
      repo,
      issueNumber: parseInt(issueNumber),
      issueTitle: issue.title,
      model: process.env.AI_MODEL,
      resolution,
    });

    res.json({ resolution, resolutionId: saved._id, cached: false });
  } catch (err) {
    console.error(err.response?.data || err.message);

    // Don't leak internal error details in production
    const isDev = process.env.NODE_ENV !== 'production';
    res.status(500).json({
      error: 'Failed to resolve issue',
      ...(isDev && { detail: err.response?.data?.error?.message || err.message }),
    });
  }
});

module.exports = router;
