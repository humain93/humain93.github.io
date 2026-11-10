import { PortfolioDatabase } from '../types/portfolio';

export interface GitHubSyncConfig {
  owner: string;
  repo: string;
  branch: string;
  token: string;
  rememberTokenInLocalStorage: boolean;
  autoPublishOnSave: boolean;
}

export interface GitHubPublishResult {
  ok: boolean;
  commitSha?: string;
  commitUrl?: string;
  pagesUrl?: string;
  actionsUrl?: string;
  message: string;
}

export interface GitHubWorkflowStatus {
  id: number;
  name: string;
  status: string; // 'queued' | 'in_progress' | 'completed'
  conclusion: string | null; // 'success' | 'failure' | 'cancelled' | null
  htmlUrl: string;
  createdAt: string;
  headBranch: string;
}

const CONFIG_STORAGE_KEY = 'phd_portfolio_github_sync_config_v1';
const SESSION_TOKEN_KEY = 'phd_portfolio_github_pat_session_v1';

export function loadGitHubSyncConfig(): GitHubSyncConfig {
  try {
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
    const sessionToken = sessionStorage.getItem(SESSION_TOKEN_KEY) || '';
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        owner: parsed.owner || '',
        repo: parsed.repo || '',
        branch: parsed.branch || 'main',
        token: parsed.rememberTokenInLocalStorage ? parsed.token || '' : sessionToken,
        rememberTokenInLocalStorage: Boolean(parsed.rememberTokenInLocalStorage),
        autoPublishOnSave: parsed.autoPublishOnSave !== undefined ? Boolean(parsed.autoPublishOnSave) : true,
      };
    }
  } catch {
    // ignore storage errors
  }
  return {
    owner: '',
    repo: '',
    branch: 'main',
    token: '',
    rememberTokenInLocalStorage: false,
    autoPublishOnSave: true,
  };
}

export function saveGitHubSyncConfig(config: GitHubSyncConfig): void {
  try {
    if (config.rememberTokenInLocalStorage) {
      sessionStorage.removeItem(SESSION_TOKEN_KEY);
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
    } else {
      if (config.token) {
        sessionStorage.setItem(SESSION_TOKEN_KEY, config.token);
      } else {
        sessionStorage.removeItem(SESSION_TOKEN_KEY);
      }
      localStorage.setItem(
        CONFIG_STORAGE_KEY,
        JSON.stringify({
          ...config,
          token: '', // Never store token in localStorage unless explicitly opted in
        })
      );
    }
  } catch {
    // ignore storage quota errors
  }
}

export function clearGitHubSyncCredentials(): void {
  try {
    sessionStorage.removeItem(SESSION_TOKEN_KEY);
    const current = loadGitHubSyncConfig();
    localStorage.setItem(
      CONFIG_STORAGE_KEY,
      JSON.stringify({
        ...current,
        token: '',
        rememberTokenInLocalStorage: false,
      })
    );
  } catch {
    // ignore
  }
}

/**
 * Lossless UTF-8 string to Base64 encoding (supports LaTeX, math symbols, Greek letters, etc.)
 */
export function encodeUtf8ToBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

/**
 * ArrayBuffer to Base64 encoding for binary image / PDF uploads
 */
export function encodeArrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

function getHeaders(token: string): HeadersInit {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token.trim()}`,
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
  };
}

export function computeGitHubPagesUrl(owner: string, repo: string): string {
  const cleanOwner = owner.trim();
  const cleanRepo = repo.trim();
  if (!cleanOwner || !cleanRepo) return '';
  if (cleanRepo.toLowerCase() === `${cleanOwner.toLowerCase()}.github.io`) {
    return `https://${cleanOwner}.github.io/`;
  }
  return `https://${cleanOwner}.github.io/${cleanRepo}/`;
}

export async function verifyGitHubRepoConnection(config: GitHubSyncConfig): Promise<{
  ok: boolean;
  message: string;
  canPush?: boolean;
  defaultBranch?: string;
  pagesUrl?: string;
}> {
  const owner = config.owner.trim();
  const repo = config.repo.trim();
  const token = config.token.trim();

  if (!owner || !repo || !token) {
    return {
      ok: false,
      message: 'Please provide your GitHub username/owner, repository name, and Personal Access Token.',
    };
  }

  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      method: 'GET',
      headers: getHeaders(token),
    });

    if (res.status === 401) {
      return { ok: false, message: 'Authentication failed (401): Invalid or expired GitHub Personal Access Token.' };
    }
    if (res.status === 404) {
      return {
        ok: false,
        message: `Repository "${owner}/${repo}" not found or token lacks access to this repository.`,
      };
    }
    if (!res.ok) {
      const errText = await res.text();
      return { ok: false, message: `GitHub API error (${res.status}): ${errText}` };
    }

    const repoData = await res.json();
    const canPush = repoData.permissions ? Boolean(repoData.permissions.push) : true;
    const defaultBranch = repoData.default_branch || 'main';
    const pagesUrl = computeGitHubPagesUrl(owner, repo);

    if (!canPush) {
      return {
        ok: false,
        canPush: false,
        defaultBranch,
        pagesUrl,
        message:
          'Connected to repository, but your token only has Read access. Please grant "Contents: Read and write" permission.',
      };
    }

    return {
      ok: true,
      canPush: true,
      defaultBranch,
      pagesUrl,
      message: `Verified write access to ${owner}/${repo} (branch: ${config.branch || defaultBranch}).`,
    };
  } catch (err) {
    return {
      ok: false,
      message: `Network error connecting to GitHub API: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

async function upsertRepoFile(
  config: GitHubSyncConfig,
  filePath: string,
  base64Content: string,
  commitMessage: string
): Promise<{ ok: boolean; commitSha?: string; commitUrl?: string; error?: string }> {
  const owner = config.owner.trim();
  const repo = config.repo.trim();
  const branch = config.branch.trim() || 'main';
  const token = config.token.trim();

  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;

  // 1. Check if file already exists on the branch to get its current blob SHA
  let existingSha: string | undefined;
  try {
    const getRes = await fetch(`${apiUrl}?ref=${encodeURIComponent(branch)}`, {
      method: 'GET',
      headers: getHeaders(token),
    });
    if (getRes.ok) {
      const fileMeta = await getRes.json();
      if (fileMeta && fileMeta.sha) {
        existingSha = fileMeta.sha;
      }
    }
  } catch {
    // File may not exist yet, proceed with creation
  }

  // 2. PUT updated or new file content
  const bodyPayload: Record<string, string> = {
    message: commitMessage,
    content: base64Content,
    branch,
  };
  if (existingSha) {
    bodyPayload.sha = existingSha;
  }

  const putRes = await fetch(apiUrl, {
    method: 'PUT',
    headers: getHeaders(token),
    body: JSON.stringify(bodyPayload),
  });

  if (!putRes.ok) {
    let errDetail = `${putRes.status} ${putRes.statusText}`;
    try {
      const errJson = await putRes.json();
      if (errJson && errJson.message) {
        errDetail = errJson.message;
      }
    } catch {
      // ignore
    }
    return { ok: false, error: `Failed to commit ${filePath}: ${errDetail}` };
  }

  const resultJson = await putRes.json();
  return {
    ok: true,
    commitSha: resultJson?.commit?.sha,
    commitUrl: resultJson?.commit?.html_url,
  };
}

/**
 * Commits the updated portfolio data directly to `src/data/defaultPortfolioData.ts`
 * and `public/data/portfolio.json` in the user's GitHub repository, automatically
 * triggering the GitHub Actions build & GitHub Pages deployment.
 */
export async function publishPortfolioToGitHub(
  config: GitHubSyncConfig,
  data: PortfolioDatabase,
  customCommitMessage?: string
): Promise<GitHubPublishResult> {
  const owner = config.owner.trim();
  const repo = config.repo.trim();
  const branch = config.branch.trim() || 'main';
  const token = config.token.trim();

  if (!owner || !repo || !token) {
    return {
      ok: false,
      message: 'GitHub repository or Personal Access Token is not configured yet.',
    };
  }

  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
  const commitMessage =
    customCommitMessage?.trim() || `CMS Publish: Update research portfolio content (${timestamp})`;

  // Format TypeScript module content
  const tsModuleContent = `import { PortfolioDatabase } from '../types/portfolio';\n\nexport const DEFAULT_PORTFOLIO_DATA: PortfolioDatabase = ${JSON.stringify(
    data,
    null,
    2
  )};\n`;

  try {
    // 1. Commit src/data/defaultPortfolioData.ts (drives the Vite static build in GitHub Actions)
    const tsResult = await upsertRepoFile(
      config,
      'src/data/defaultPortfolioData.ts',
      encodeUtf8ToBase64(tsModuleContent),
      commitMessage
    );

    if (!tsResult.ok) {
      return {
        ok: false,
        message: tsResult.error || 'Failed to commit src/data/defaultPortfolioData.ts to GitHub.',
      };
    }

    // 2. Also commit public/data/portfolio.json so runtime static fetches have the exact JSON snapshot
    const jsonContent = JSON.stringify(data, null, 2);
    await upsertRepoFile(
      config,
      'public/data/portfolio.json',
      encodeUtf8ToBase64(jsonContent),
      `${commitMessage} [JSON snapshot]`
    );

    const pagesUrl = computeGitHubPagesUrl(owner, repo);
    const actionsUrl = `https://github.com/${owner}/${repo}/actions`;

    return {
      ok: true,
      commitSha: tsResult.commitSha,
      commitUrl: tsResult.commitUrl || `https://github.com/${owner}/${repo}/commits/${branch}`,
      pagesUrl,
      actionsUrl,
      message: `Committed to ${owner}/${repo}@${branch} (${tsResult.commitSha?.slice(0, 7) || 'HEAD'}). GitHub Actions is now building & deploying to GitHub Pages!`,
    };
  } catch (err) {
    return {
      ok: false,
      message: `Unexpected error during GitHub publish: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/**
 * Uploads an image or PDF file directly to `public/assets/uploads/<filename>` in the GitHub repository
 * so the user never has to manually copy files into their repo.
 */
export async function uploadAssetFileToGitHub(
  config: GitHubSyncConfig,
  file: File
): Promise<{ ok: boolean; assetPath?: string; message: string }> {
  const owner = config.owner.trim();
  const repo = config.repo.trim();
  const token = config.token.trim();

  if (!owner || !repo || !token) {
    return { ok: false, message: 'GitHub sync not configured.' };
  }

  try {
    const buffer = await file.arrayBuffer();
    const base64Data = encodeArrayBufferToBase64(buffer);
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const targetFileName = `${Date.now()}_${safeName}`;
    const repoPath = `public/assets/uploads/${targetFileName}`;

    const res = await upsertRepoFile(
      config,
      repoPath,
      base64Data,
      `CMS Asset Upload: ${safeName}`
    );

    if (!res.ok) {
      return { ok: false, message: res.error || 'Failed to upload asset to GitHub.' };
    }

    return {
      ok: true,
      assetPath: `/assets/uploads/${targetFileName}`,
      message: `Uploaded ${safeName} directly to ${repoPath} in GitHub repository.`,
    };
  } catch (err) {
    return {
      ok: false,
      message: `Error uploading file to GitHub: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/**
 * Fetches the latest GitHub Actions workflow run so the user can monitor build & deploy progress inside the CMS.
 */
export async function fetchLatestWorkflowRun(
  config: GitHubSyncConfig
): Promise<GitHubWorkflowStatus | null> {
  const owner = config.owner.trim();
  const repo = config.repo.trim();
  const token = config.token.trim();

  if (!owner || !repo || !token) return null;

  try {
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/actions/runs?per_page=1`,
      {
        method: 'GET',
        headers: getHeaders(token),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const latest = data?.workflow_runs?.[0];
    if (!latest) return null;

    return {
      id: latest.id,
      name: latest.name || 'Deploy to GitHub Pages',
      status: latest.status,
      conclusion: latest.conclusion,
      htmlUrl: latest.html_url,
      createdAt: latest.created_at,
      headBranch: latest.head_branch,
    };
  } catch {
    return null;
  }
}

export const GITHUB_ACTIONS_WORKFLOW_YAML = `name: Deploy Academic Portfolio to GitHub Pages

on:
  push:
    branches: ["main"]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build-and-deploy:
    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up Node.js 22
        uses: actions/setup-node@v4
        with:
          node-version: "22"

      - name: Install dependencies
        run: npm install --legacy-peer-deps --no-audit --no-fund

      - name: Build static production bundle
        run: npm run build

      - name: Configure GitHub Pages
        uses: actions/configure-pages@v5

      - name: Upload static artifact (dist)
        uses: actions/upload-pages-artifact@v3
        with:
          path: "./dist"

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
`;
