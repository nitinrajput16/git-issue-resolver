const express = require('express');
const passport = require('passport');
const router = express.Router();

// Kick off GitHub OAuth flow
router.get('/github', passport.authenticate('github', { scope: ['user:email', 'repo'] }));

// GitHub redirects back here after user approves
router.get(
  '/github/callback',
  passport.authenticate('github', { failureRedirect: `${process.env.CLIENT_URL}/login?error=auth_failed` }),
  (req, res) => {
    res.redirect(`${process.env.CLIENT_URL}/dashboard`);
  }
);

// Get current logged-in user
router.get('/me', (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ user: null });
  const { _id, username, displayName, email, avatarUrl } = req.user;
  res.json({ user: { _id, username, displayName, email, avatarUrl } });
});

// Logout
router.post('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.json({ success: true });
  });
});

module.exports = router;
