require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const cors = require('cors');
const mongoose = require('mongoose');
const dns = require('dns');

const authRoutes = require('./routes/auth');
const issuesRoutes = require('./routes/issues');
const resolveRoutes = require('./routes/resolve');
const historyRoutes = require('./routes/history');
const prRoutes = require('./routes/pr');

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3000;

// ─── DNS override (fixes Atlas SRV lookups on restrictive networks) ──────────
async function initMongo() {
  const mongoDnsServers = process.env.MONGODB_DNS_SERVERS
    ? process.env.MONGODB_DNS_SERVERS.split(',').map((s) => s.trim()).filter(Boolean)
    : ['8.8.8.8', '1.1.1.1']; // default to Google + Cloudflare

  try {
    dns.setServers(mongoDnsServers);
    console.log('🌐 Using DNS servers for MongoDB:', mongoDnsServers.join(', '));
  } catch (error) {
    console.error('⚠️  Failed to set custom DNS, falling back to system DNS:', error.message);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB error:', err.message);
    process.exit(1); // exit so nodemon/pm2 can restart cleanly
  }
}

initMongo();

// ─── Middleware ───────────────────────────────────
app.use(express.json());
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev-secret',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
    cookie: {
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

require('./middleware/passport')(passport);

// ─── Routes ──────────────────────────────────────
app.use('/auth', authRoutes);
app.use('/api/issues', issuesRoutes);
app.use('/api/resolve', resolveRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/pr', prRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.get('/api/models', (req, res) =>
  res.json({ model: process.env.AI_MODEL, provider: 'openrouter' })
);

// ─── Start ────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});