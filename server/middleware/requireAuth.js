const jwt = require('jsonwebtoken');
const User = require('../models/User');

const requireAuth = async (req, res, next) => {
  const auth = req.headers.authorization;
  
  console.log('requireAuth check:', {
    hasAuthHeader: !!auth,
    url: req.originalUrl,
    method: req.method
  });

  if (!auth?.startsWith('Bearer ')) {
    console.log('No Bearer token found');
    return res.status(401).json({ error: 'Unauthorized — no token provided' });
  }

  const token = auth.slice(7);

  try {
    const decoded = jwt.verify(token, process.env.SESSION_SECRET);
    console.log('Token verified, user ID:', decoded._id);
    
    // Load full user from database including encrypted accessToken
    const user = await User.findById(decoded._id);
    if (!user) {
      console.log('User not found in database');
      return res.status(401).json({ error: 'Unauthorized — user not found' });
    }
    
    console.log('User found:', user.username);
    req.user = user;
    next();
  } catch (err) {
    console.error('JWT verification failed:', err.message);
    return res.status(401).json({ error: 'Unauthorized — invalid token' });
  }
};

module.exports = { requireAuth };
