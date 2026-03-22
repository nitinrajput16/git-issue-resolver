const jwt = require('jsonwebtoken');
const User = require('../models/User');

const requireAuth = async (req, res, next) => {
  const auth = req.headers.authorization;
  
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized — no token provided' });
  }

  const token = auth.slice(7);

  try {
    const decoded = jwt.verify(token, process.env.SESSION_SECRET);
    
    // Load full user from database including encrypted accessToken
    const user = await User.findById(decoded._id);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized — user not found' });
    }
    
    req.user = user;
    next();
  } catch (err) {
    console.error('JWT verification failed:', err.message);
    return res.status(401).json({ error: 'Unauthorized — invalid token' });
  }
};

module.exports = { requireAuth };
