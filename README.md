# GitHub Issue Resolver

AI-powered tool that analyzes your GitHub issues and generates fixes using OpenRouter (Groq, OpenAI, and more).

## 🚀 Features

- **Smart Issue Analysis**: AI analyzes issue descriptions, comments, and code context
- **Multi-Model Support**: Works with Groq, OpenAI, Claude, and any OpenRouter model
- **GitHub Integration**: OAuth login, fetch issues, apply labels, create pull requests
- **Resolution History**: Track all AI-generated fixes with confidence scores
- **Dark/Light Theme**: Built-in theme toggle
- **Real-time Updates**: Cached resolutions, pagination, search, and filters

## 🛠️ Stack

- **Frontend**: React 18 + Vite + TailwindCSS + React Query + React Router
- **Backend**: Node.js + Express + Passport.js + Express Session
- **Database**: MongoDB + Mongoose
- **Auth**: GitHub OAuth 2.0 (user:email, repo scopes)
- **AI**: OpenRouter API (Groq / OpenAI / Claude / any model)
- **Styling**: TailwindCSS with dark mode support
- **State**: React Query for server state, localStorage for auth token

## 📦 Project Structure

```
github-issue-resolver/
├── client/                  # React frontend (Vite)
│   ├── src/
│   │   ├── components/      # Layout, IssueCard, ResolutionPanel, ErrorBoundary
│   │   ├── pages/           # Login, Dashboard, IssuePage, History, AuthCallback
│   │   ├── hooks/           # useAuth, useTheme
│   │   ├── lib/             # api.js (axios client)
│   │   └── App.jsx          # Router setup with protected routes
│   ├── vite.config.js       # Vite configuration
│   └── package.json
├── server/                  # Express backend
│   ├── routes/              # auth, issues, resolve, history, pr
│   ├── services/            # githubService, aiService
│   ├── models/              # User, Resolution (Mongoose)
│   ├── middleware/          # passport.js, requireAuth.js
│   ├── index.js             # Server entry with MongoDB connection
│   └── package.json
├── package.json             # Root workspace scripts
└── README.md
```

## ⚙️ Setup

### 1. Clone & Install

```bash
git clone <your-repo>
cd github-issue-resolver
npm run install:all
```

### 2. GitHub OAuth App

1. Go to https://github.com/settings/developers
2. Click **New OAuth App**
3. Set:
   - **Homepage URL**: `http://localhost:5173`
   - **Authorization callback URL**: `http://localhost:3000/auth/github/callback`
4. Copy the **Client ID** and **Client Secret**

### 3. OpenRouter API Key

1. Sign up at https://openrouter.ai
2. Go to Keys → Create Key
3. Copy the key — it works with Groq, OpenAI, Claude, and dozens of other models

### 4. Configure Environment

```bash
cd server
cp .env.example .env
```

Edit `server/.env`:

```env
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=http://localhost:3000/auth/github/callback

OPENROUTER_API_KEY=your_openrouter_key
AI_MODEL=meta-llama/llama-3.1-70b-instruct   # or groq/mixtral-8x7b-32768

MONGODB_URI=mongodb://localhost:27017/github-issue-resolver
SESSION_SECRET=any-long-random-string
CLIENT_URL=http://localhost:5173
PORT=3000
```

### 5. Start MongoDB

```bash
# macOS (Homebrew)
brew services start mongodb-community

# or with Docker
docker run -d -p 27017:27017 mongo
```

### 6. Run the App

```bash
# From root — starts both server and client
npm run dev
```

Open http://localhost:5173

## 🤖 AI Models

| Model | Speed | Cost | Notes |
|-------|-------|------|-------|
| `meta-llama/llama-3.1-70b-instruct` | Fast | Free tier | Good balance |
| `groq/llama-3.1-70b-versatile` | Very fast | Low | Best for speed |
| `groq/mixtral-8x7b-32768` | Fast, long context | Low | Good for long issues |
| `openai/gpt-4o` | High quality | Medium | Premium quality |
| `anthropic/claude-3.5-sonnet` | High quality | Medium | Premium quality |

Change `AI_MODEL` in `.env` to switch anytime — no code changes needed.

## 🎯 Usage

1. **Login**: Click "Continue with GitHub" on the login page
2. **Dashboard**: View your assigned issues with filters (open/closed/all)
3. **Resolve**: Click "Resolve with AI" on any issue to analyze and generate a fix
4. **Review**: View AI-generated root cause, steps, code diff, and explanation
5. **Apply**: Create a pull request with the suggested fix
6. **History**: Track all resolutions with confidence scores and search

## 🔧 Key Features

### Issue Resolution Flow
- Fetches issue body, comments, and code context
- Analyzes with AI to generate root cause, steps, and code fixes
- Provides confidence score (high/medium/low)
- Suggests GitHub labels
- Creates pull requests with the fix

### Caching & Performance
- Resolutions cached in MongoDB to avoid duplicate AI calls
- Pagination for issue lists
- Rate limiting (10 requests/minute per user)
- Retry logic for AI calls with exponential backoff

### Security

The application implements comprehensive security measures:

**Authentication & Authorization:**
- GitHub OAuth 2.0 with minimal required scopes (user:email, repo)
- JWT tokens with 7-day expiry stored in localStorage
- Session-less backend architecture with JWT verification middleware
- Protected routes requiring authentication

**API Security:**
- Global rate limiting (100 requests per 15 minutes per IP)
- Input validation and sanitization on all endpoints
- CORS configuration with specific allowed origins and headers
- Request size limits (1MB) to prevent large payload attacks

**GitHub Integration Security:**
- Token-based GitHub API authentication
- Secure token handling with partial logging for debugging
- Timeout configurations for external API calls
- Error handling for GitHub API failures

**Infrastructure Security:**
- Environment variable protection for sensitive data
- DNS server configuration for MongoDB connectivity
- Trust proxy configuration for proper IP detection
- Dependency audit with 0 vulnerabilities (confirmed via npm audit)

**Data Protection:**
- MongoDB connection with proper error handling
- Secure storage of user data and resolution history
- No sensitive data stored in client-side code

### UI/UX
- Dark/light theme toggle
- Responsive design
- Skeleton loading states
- Error boundaries for graceful failures
- Toast notifications for user feedback

## 🚀 Deployment

### Frontend → Vercel
```bash
cd client && npm run build
# Deploy dist/ to Vercel
```

### Backend → Railway / Render
- Set all environment variables in the dashboard
- Point `CLIENT_URL` to your Vercel URL
- Point `GITHUB_CALLBACK_URL` to `https://your-backend.railway.app/auth/github/callback`
- Update GitHub OAuth app callback URL to match
- Configure DNS servers for MongoDB connectivity if needed

### Database → MongoDB Atlas
- Create a free cluster at https://cloud.mongodb.com
- Replace `MONGODB_URI` with your Atlas connection string
- Configure network access and database users appropriately

## 📊 API Endpoints

### Auth
- `GET /auth/github` - Initiate GitHub OAuth
- `GET /auth/github/callback` - Handle OAuth callback
- `GET /auth/me` - Get current user
- `POST /auth/logout` - Logout

### Issues
- `GET /api/issues` - List user issues
- `GET /api/issues/:owner/:repo/:number` - Get issue details
- `POST /api/issues/:owner/:repo/:number/labels` - Apply labels

### Resolution
- `POST /api/resolve` - Analyze and resolve issue
- `GET /api/history` - List resolution history
- `GET /api/history/:id` - Get specific resolution
- `DELETE /api/history/:id` - Delete resolution

### Pull Requests
- `POST /api/pr/create` - Create PR with fix

## 🔍 Project Analysis Summary

This GitHub Issue Resolver demonstrates a well-architected full-stack application with:

**Architecture Strengths:**
- Clean separation between frontend (React/Vite) and backend (Node.js/Express)
- Modular service layer for GitHub and AI integrations
- Comprehensive error handling and logging throughout
- Responsive UI with modern React patterns (hooks, context)

**Security Posture:**
- Zero dependency vulnerabilities confirmed via npm audit
- Robust authentication and authorization flow
- Multiple layers of API protection (rate limiting, CORS, input validation)
- Secure handling of sensitive tokens and environment variables

**Scalability Features:**
- Caching mechanisms for AI responses
- Pagination and filtering for large issue lists
- Configurable AI model selection without code changes
- MongoDB-based data persistence with proper indexing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.
reseted