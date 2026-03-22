const axios = require('axios');

const githubApi = (token) => {
  return axios.create({
    baseURL: 'https://api.github.com',
    timeout: 10000,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });
};

const GitHubService = {
  async getUserIssues(token, { filter = 'all', state = 'open', page = 1 } = {}) {
    const api = githubApi(token);
    const { data } = await api.get('/issues', {
      params: { filter, state, per_page: 25, page },
    });
    return data;
  },

  async getIssue(token, owner, repo, number) {
    const api = githubApi(token);
    const { data } = await api.get(`/repos/${owner}/${repo}/issues/${number}`);
    return data;
  },

  async getIssueComments(token, owner, repo, number) {
    const api = githubApi(token);
    const { data } = await api.get(
      `/repos/${owner}/${repo}/issues/${number}/comments`
    );
    return data;
  },

  async applyLabels(token, owner, repo, number, labels) {
    const api = githubApi(token);
    const { data } = await api.post(
      `/repos/${owner}/${repo}/issues/${number}/labels`,
      { labels }
    );
    return data;
  },

  async getFileContents(token, owner, repo, path) {
    const api = githubApi(token);
    const { data } = await api.get(`/repos/${owner}/${repo}/contents/${path}`);
    const content = Buffer.from(data.content, 'base64').toString('utf-8');
    return { content, sha: data.sha };
  },

  async createOrUpdateFile(token, owner, repo, path, content, message, sha) {
    const api = githubApi(token);
    const { data } = await api.put(`/repos/${owner}/${repo}/contents/${path}`, {
      message,
      content: Buffer.from(content).toString('base64'),
      sha,
    });
    return data;
  },

  async createBranch(token, owner, repo, branchName, fromSha) {
    const api = githubApi(token);
    const { data } = await api.post(`/repos/${owner}/${repo}/git/refs`, {
      ref: `refs/heads/${branchName}`,
      sha: fromSha,
    });
    return data;
  },

  async getDefaultBranchSha(token, owner, repo) {
    const api = githubApi(token);
    const { data: repoData } = await api.get(`/repos/${owner}/${repo}`);
    const branch = repoData.default_branch;
    const { data: refData } = await api.get(
      `/repos/${owner}/${repo}/git/refs/heads/${branch}`
    );
    return { sha: refData.object.sha, branch };
  },

  async createPullRequest(token, owner, repo, { title, body, head, base }) {
    const api = githubApi(token);
    const { data } = await api.post(`/repos/${owner}/${repo}/pulls`, {
      title,
      body,
      head,
      base,
    });
    return data;
  },
};

module.exports = GitHubService;
