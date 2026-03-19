# GitHub Issue Resolver

AI-powered tool that analyzes your GitHub issues and generates fixes using OpenRouter (Groq, OpenAI, and more).

## Stack

- **Frontend**: React + Vite + TailwindCSS + React Query
- **Backend**: Node.js + Express + Passport.js
- **Database**: MongoDB + Mongoose
- **Auth**: GitHub OAuth
- **AI**: OpenRouter API (Groq / OpenAI / any model)

---

## Setup

### 1. Clone & install

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

### 4. Configure environment

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

### 6. Run the app

```bash
# From root — starts both server and client
npm run dev
```

Open http://localhost:5173

---

## OpenRouter Model Options

| Model | Speed | Cost |
|-------|-------|------|
| `meta-llama/llama-3.1-70b-instruct` | Fast | Free tier |
| `groq/llama-3.1-70b-versatile` | Very fast | Low |
| `groq/mixtral-8x7b-32768` | Fast, long context | Low |
| `openai/gpt-4o` | High quality | Medium |
| `anthropic/claude-3.5-sonnet` | High quality | Medium |

Change `AI_MODEL` in `.env` to switch anytime — no code changes needed.

---

## Project Structure

```
github-issue-resolver/
├── client/                  # React frontend (Vite)
│   └── src/
│       ├── components/      # Layout, IssueCard, ResolutionPanel
│       ├── pages/           # Login, Dashboard, IssuePage, History
│       ├── hooks/           # useAuth
│       └── lib/             # api.js (axios client)
├── server/                  # Express backend
│   ├── routes/              # auth, issues, resolve, history, pr
│   ├── services/            # githubService, aiService
│   ├── models/              # User, Resolution (Mongoose)
│   └── middleware/          # passport.js, requireAuth.js
└── package.json             # Root workspace scripts
```

---

## Deployment

### Frontend → Vercel
```bash
cd client && npm run build
# Deploy dist/ to Vercel
```

### Backend → Railway / Render
- Set all env vars in the dashboard
- Point `CLIENT_URL` to your Vercel URL
- Point `GITHUB_CALLBACK_URL` to `https://your-backend.railway.app/auth/github/callback`
- Update GitHub OAuth app callback URL to match

### Database → MongoDB Atlas
- Create a free cluster at https://cloud.mongodb.com
- Replace `MONGODB_URI` with your Atlas connection string
