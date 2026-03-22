const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const router = express.Router();

router.get('/github', passport.authenticate('github', { scope: ['user:email', 'repo'] }));

router.get(
  '/github/callback',
  passport.authenticate('github', {
    session: false,
    failureRedirect: `${process.env.CLIENT_URL}/login?error=auth_failed`,
  }),
  (req, res) => {
    const token = jwt.sign(
      {
        _id:         req.user._id,
        username:    req.user.username,
        displayName: req.user.displayName,
        email:       req.user.email,
        avatarUrl:   req.user.avatarUrl,
      },
      process.env.SESSION_SECRET,
      { expiresIn: '7d' }
    );

    // Send an HTML page that stores token and redirects
    // This avoids Chrome's bounce tracking mitigation
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Signing in...</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
        </head>
        <body>
          <p>Signing you in...</p>
          <script>
            try {
              localStorage.setItem('auth_token', '${token}');
              // Redirect to the auth callback with the token
              window.location.href = '${process.env.CLIENT_URL}/auth/callback?token=${token}';
            } catch (e) {
              document.body.innerHTML = '<p>Authentication failed. Please try again.</p>';
            }
          </script>
        </body>
      </html>
    `);
  }
);

router.get('/me', (req, res) => {
  const auth = req.headers.authorization;
  
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ user: null, error: 'No token provided' });
  }
  
  try {
    const user = jwt.verify(auth.slice(7), process.env.SESSION_SECRET);
    // Return the full user object including the encrypted accessToken
    res.json({ user });
  } catch (err) {
    console.error('Auth verification error:', err.message);
    res.status(401).json({ user: null, error: 'Invalid token' });
  }
});

router.post('/logout', (req, res) => {
  res.json({ success: true }); // client just deletes the token
});

module.exports = router;