const axios = require('axios');

const openRouterClient = axios.create({
  baseURL: 'https://openrouter.ai/api/v1',
  timeout: 30000, // 30s — never hang indefinitely
  headers: {
    Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
    'HTTP-Referer': process.env.CLIENT_URL || 'http://localhost:5173',
    'X-Title': 'GitHub Issue Resolver',
    'Content-Type': 'application/json',
  },
});

const SYSTEM_PROMPT = `You are an expert software engineer specializing in debugging and resolving GitHub issues.
Analyze the provided issue thoroughly and return ONLY a valid JSON object (no markdown, no explanation outside JSON) with this exact structure:

{
  "rootCause": "A concise 1-2 sentence explanation of what's causing the issue",
  "explanation": "A plain-English paragraph explaining the issue context and why the fix works",
  "steps": ["Step 1 description", "Step 2 description"],
  "codeFix": [
    {
      "filename": "path/to/file.js",
      "before": "// existing code snippet that needs changing",
      "after": "// the corrected code"
    }
  ],
  "confidence": "high|medium|low",
  "suggestedLabels": ["bug", "good first issue"]
}

Rules:
- confidence is "high" if you can clearly identify the bug, "medium" if you need more context, "low" if speculative
- codeFix can be an empty array if no specific code fix is identifiable
- steps should be actionable, numbered steps a developer can follow
- suggestedLabels should be real GitHub label names`;

// Retry with exponential backoff — recovers most transient OpenRouter 5xx errors
async function callWithRetry(fn, maxRetries = 2) {
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const status = err.response?.status;
      const isRetryable = !status || status >= 500;
      if (!isRetryable || attempt === maxRetries) break;
      const delay = 1000 * Math.pow(2, attempt); // 1s, 2s
      console.warn(`⚠️  AI call failed (attempt ${attempt + 1}), retrying in ${delay}ms…`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastError;
}

const AIService = {
  async resolveIssue({ issueTitle, issueBody, comments, codeContext, language, repoName }) {
    const commentsText = comments
      .slice(0, 10)
      .map((c, i) => `Comment ${i + 1} by @${c.user.login}:\n${c.body}`)
      .join('\n\n---\n\n');

    const userMessage = `
Repository: ${repoName}
Language: ${language || 'Unknown'}

## Issue Title
${issueTitle}

## Issue Body
${issueBody || 'No description provided.'}

${commentsText ? `## Comments\n${commentsText}` : ''}

${codeContext ? `## Relevant Code\n\`\`\`\n${codeContext}\n\`\`\`` : ''}

Analyze this issue and provide a resolution in the exact JSON format specified.
`.trim();

    const response = await callWithRetry(() =>
      openRouterClient.post('/chat/completions', {
        model: process.env.AI_MODEL || 'meta-llama/llama-3.1-8b-instruct:free',
        max_tokens: 2000,
        temperature: 0.3,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMessage },
        ],
      })
    );

    const raw = response.data.choices[0].message.content.trim();
    const cleaned = raw.replace(/^```json?\s*/i, '').replace(/\s*```$/, '');

    try {
      return JSON.parse(cleaned);
    } catch {
      return {
        rootCause: 'Unable to parse AI response. Try again.',
        explanation: raw,
        steps: [],
        codeFix: [],
        confidence: 'low',
        suggestedLabels: [],
      };
    }
  },
};

module.exports = AIService;
