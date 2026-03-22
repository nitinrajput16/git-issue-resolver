require('dotenv').config();
const express = require('express');
const passport = require('passport');
const cors = require('cors');
const mongoose = require('mongoose');
const dns = require('dns');

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

app.use(express.json());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(passport.initialize());
require('./middleware/passport')(passport);

app.use('/auth',        authRoutes);
app.use('/api/issues',  issuesRoutes);
app.use('/api/resolve', resolveRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/pr',      prRoutes);

app.get('/health',     (req, res) => res.json({ status: 'ok' }));
app.get('/api/models', (req, res) => res.json({ model: process.env.AI_MODEL, provider: 'openrouter' }));

app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));