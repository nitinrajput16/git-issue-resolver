require('dotenv').config();
const express = require('express');
const passport = require('passport');
const cors = require('cors');
const mongoose = require('mongoose');
const dns = require('dns');
const rateLimit = require('express-rate-limit');

const authRoutes    = require('./routes/auth');
const issuesRoutes  = require('./routes/issues');
const resolveRoutes = require('./routes/resolve');
const historyRoutes = require('./routes/history');
const prRoutes      = require('./routes/pr');

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3000;

async function initMongo() {
  const mongoDnsServers = process.env.MONGODB_DNS_SERVERS
    ? process.env.MONGODB_DNS_SERVERS.split(',').map((s) => s.trim()).filter(Boolean)
    : ['8.8.8.8', '1.1.1.1'];
  try {
    dns.setServers(mongoDnsServers);
    console.log('🌐 Using DNS servers:', mongoDnsServers.join(', '));
  } catch (error) {
    console.error('⚠️  DNS override failed:', error.message);
  }
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB error:', err.message);
    process.exit(1);
  }
}

initMongo();

app.use(express.json({ limit: '1mb' })); // Prevent large payload attacks
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(passport.initialize());
require('./middleware/passport')(passport);

// Global rate limiting for all API routes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all routes
app.use('/auth', apiLimiter, authRoutes);
app.use('/api/issues', apiLimiter, issuesRoutes);
app.use('/api/resolve', apiLimiter, resolveRoutes);
app.use('/api/history', apiLimiter, historyRoutes);
app.use('/api/pr', apiLimiter, prRoutes);

app.get('/health',     (req, res) => res.json({ status: 'ok' }));
app.get('/api/models', (req, res) => res.json({ model: process.env.AI_MODEL, provider: 'openrouter' }));

app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));