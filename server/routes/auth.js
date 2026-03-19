const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const router = express.Router();

router.get('/github', passport.authenticate('github', { scope: ['user:email', 'repo'] }));

router.get(
  '/github/callback',
  passport.authenticate('github', { session: false, failureRedirect: `${process.env.CLIENT_URL}/login?error=auth_failed` }),
  (req, res) => {
    // Sign a JWT with user info
    const token = jwt.sign(
      {
        _id: req.user._id,
        username: req.user.username,
        displayName: req.user.displayName,
        email: req.user.email,
        avatarUrl: req.user.avatarUrl,
      },
      process.env.SESSION_SECRET,
      { expiresIn: '7d' }
    );
    // Send token to frontend via URL param
    res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${token}`);
  }
);

router.get('/me', (req, res) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ user: null });
  try {
    const user = jwt.verify(auth.slice(7), process.env.SESSION_SECRET);
    res.json({ user });
  } catch {
    res.status(401).json({ user: null });
  }
});

router.post('/logout', (req, res) => {
  res.json({ success: true }); // client just deletes the token
});

module.exports = router;