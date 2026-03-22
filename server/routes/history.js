const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/requireAuth');
const Resolution = require('../models/Resolution');

// GET /api/history
router.get('/', requireAuth, async (req, res) => {
  try {
    const { repo, confidence, search } = req.query;
    const filter = { userId: req.user._id };

    if (repo) filter.repo = repo;
    if (confidence) filter['resolution.confidence'] = confidence;
    if (search) filter.issueTitle = { $regex: search, $options: 'i' };

    const resolutions = await Resolution.find(filter)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.json({ resolutions });
  } catch (err) {
    console.error('Failed to fetch history:', err.message);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// GET /api/history/:id
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const resolution = await Resolution.findOne({
      _id: req.params.id,
      userId: req.user._id,
    }).lean();

    if (!resolution) return res.status(404).json({ error: 'Not found' });
    res.json({ resolution });
  } catch (err) {
    console.error('Failed to fetch resolution:', err.message);
    res.status(500).json({ error: 'Failed to fetch resolution' });
  }
});

// DELETE /api/history/:id
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await Resolution.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    res.json({ success: true });
  } catch (err) {
    console.error('Failed to delete resolution:', err.message);
    res.status(500).json({ error: 'Failed to delete' });
  }
});

module.exports = router;
