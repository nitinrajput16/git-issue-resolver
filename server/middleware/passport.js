const GitHubStrategy = require('passport-github2').Strategy;
const User = require('../models/User');

module.exports = (passport) => {
  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: process.env.GITHUB_CALLBACK_URL,
        scope: ['user:email', 'repo', 'read:user'],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          let user = await User.findOne({ githubId: profile.id });
          if (user) {
            user.accessToken = accessToken;
            user.username    = profile.username;
            user.displayName = profile.displayName || profile.username;
            user.avatarUrl   = profile.photos?.[0]?.value || '';
            await user.save();
          } else {
            user = await User.create({
              githubId:    profile.id,
              username:    profile.username,
              displayName: profile.displayName || profile.username,
              email:       profile.emails?.[0]?.value || '',
              avatarUrl:   profile.photos?.[0]?.value || '',
              accessToken,
            });
          }
          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );

  // ← These are required even with session:false, passport needs them
  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((user, done) => done(null, user));
};