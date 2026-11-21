import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { PortfolioDatabase } from '../types/portfolio';
import { DEFAULT_PORTFOLIO_DATA } from '../data/defaultPortfolioData';
import { LAST_GH_COMMIT_TS_KEY } from '../utils/githubPublisher';

const LOCAL_STORAGE_KEY = 'phd_research_portfolio_db_v6';
const LOCAL_STORAGE_TS_KEY = 'phd_research_portfolio_ts_v6';
const SESSION_AUTH_KEY = 'phd_research_cms_auth_v1';

interface PortfolioContextValue {
  data: PortfolioDatabase;
  isLoading: boolean;
  isSaving: boolean;
  lastSavedAt: string | null;
  isAdminAuthenticated: boolean;
  adminPasscode: string;
  verifyAdminPasscode: (passcode: string) => Promise<boolean>;
  logoutAdmin: () => void;
  savePortfolioData: (nextData: PortfolioDatabase) => Promise<boolean>;
  resetToDefaults: () => Promise<void>;
  exportDatabaseJson: () => void;
  importDatabaseJson: (jsonString: string) => Promise<boolean>;
}

const PortfolioContext = createContext<PortfolioContextValue | undefined>(undefined);

export const PortfolioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<PortfolioDatabase>(() => {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.profile && Array.isArray(parsed.projects)) {
          return parsed;
        }
      }
    } catch {
      // ignore localStorage read errors
    }
    return DEFAULT_PORTFOLIO_DATA;
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [adminPasscode, setAdminPasscode] = useState<string>(() => {
    return sessionStorage.getItem(SESSION_AUTH_KEY) || '';
  });
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return Boolean(sessionStorage.getItem(SESSION_AUTH_KEY));
  });

  useEffect(() => {
    let mounted = true;

    async function fetchLatestFromGitHubIfConfigured(): Promise<PortfolioDatabase | null> {
      try {
        const rawCfg = localStorage.getItem('phd_portfolio_github_sync_config_v1');
        if (!rawCfg) return null;
        const cfg = JSON.parse(rawCfg);
        const owner = (cfg.owner || '').trim();
        const repo = (cfg.repo || '').trim();
        const branch = (cfg.branch || 'main').trim();
        const token = (
          cfg.token ||
          sessionStorage.getItem('phd_portfolio_github_pat_session_v1') ||
          ''
        ).trim();
        const lastCommitTs = Number(localStorage.getItem(LAST_GH_COMMIT_TS_KEY) || '0');

        // Only pull from GitHub API if the admin has actively configured a PAT or committed via CMS
        if (!owner || !repo || (!token && lastCommitTs === 0)) return null;

        const headers: HeadersInit = {
          Accept: 'application/vnd.github.raw+json',
        };
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const ghRes = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/contents/public/data/portfolio.json?ref=${encodeURIComponent(branch)}&t=${Date.now()}`,
          { headers, cache: 'no-store' }
        );
        if (ghRes.ok) {
          const ghData = await ghRes.json();
          if (ghData && ghData.profile && Array.isArray(ghData.projects)) {
            return ghData as PortfolioDatabase;
          }
        }
      } catch {
        // Ignore GitHub fetch errors
      }
      return null;
    }

    async function initializePortfolioData() {
      // 1. First check if the local Express backend (/api/portfolio) is active (AI Studio dev/server environment).
      // In the local development environment, /api/portfolio (backed by public/data/portfolio.json and src/data/defaultPortfolioData.ts)
      // is the authoritative source of truth and must NEVER be overwritten by older commits on GitHub.
      try {
        const res = await fetch('/api/portfolio', { cache: 'no-store' });
        if (res.ok) {
          const contentType = res.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const serverData: PortfolioDatabase = await res.json();
            if (mounted && serverData && serverData.profile && Array.isArray(serverData.projects)) {
              setData(serverData);
              try {
                localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(serverData));
              } catch {
                // ignore quota error
              }
              setIsLoading(false);
              return;
            }
          }
        }
      } catch {
        // Running on static host (e.g., GitHub Pages) without Express backend
      }

      // 2. When running on static hosting (GitHub Pages), check if the admin recently committed via the in-CMS GitHub publisher
      const localCachedRaw = localStorage.getItem(LOCAL_STORAGE_KEY);
      const localSavedTs = Number(localStorage.getItem(LOCAL_STORAGE_TS_KEY) || '0');
      let localCachedData: PortfolioDatabase | null = null;
      try {
        if (localCachedRaw) {
          const parsed = JSON.parse(localCachedRaw);
          if (parsed && parsed.profile && Array.isArray(parsed.projects)) {
            localCachedData = parsed;
          }
        }
      } catch {
        localCachedData = null;
      }

      // If the user saved edits in this browser within the last 2 minutes (while GitHub Actions is still building),
      // keep their immediate local edits intact
      if (localCachedData && localSavedTs > 0 && Date.now() - localSavedTs < 120000) {
        if (mounted) {
          setData(localCachedData);
          setIsLoading(false);
        }
        return;
      }

      const ghLiveData = await fetchLatestFromGitHubIfConfigured();
      if (ghLiveData && mounted) {
        setData(ghLiveData);
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(ghLiveData));
        } catch {
          // ignore
        }
        setIsLoading(false);
        return;
      }

      // 3. Otherwise fetch the deployed static ./data/portfolio.json on GitHub Pages
      try {
        const staticRes = await fetch(`./data/portfolio.json?t=${Date.now()}`, {
          cache: 'no-store',
        });
        if (staticRes.ok) {
          const contentType = staticRes.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const staticData: PortfolioDatabase = await staticRes.json();
            if (mounted && staticData && staticData.profile && Array.isArray(staticData.projects)) {
              setData(staticData);
              try {
                localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(staticData));
              } catch {
                // ignore quota error
              }
              setIsLoading(false);
              return;
            }
          }
        }
      } catch {
        // Fallback to localStorage or compiled DEFAULT_PORTFOLIO_DATA
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    initializePortfolioData();
    return () => {
      mounted = false;
    };
  }, []);

  const verifyAdminPasscode = useCallback(async (passcode: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode }),
      });
      if (res.ok) {
        setAdminPasscode(passcode);
        setIsAdminAuthenticated(true);
        sessionStorage.setItem(SESSION_AUTH_KEY, passcode);
        return true;
      }
      return false;
    } catch {
      // Static fallback if backend route isn't active (e.g., on GitHub Pages)
      if (passcode === 'phd2027') {
        setAdminPasscode(passcode);
        setIsAdminAuthenticated(true);
        sessionStorage.setItem(SESSION_AUTH_KEY, passcode);
        return true;
      }
      return false;
    }
  }, []);

  const logoutAdmin = useCallback(() => {
    setAdminPasscode('');
    setIsAdminAuthenticated(false);
    sessionStorage.removeItem(SESSION_AUTH_KEY);
  }, []);

  const savePortfolioData = useCallback(
    async (nextData: PortfolioDatabase): Promise<boolean> => {
      setIsSaving(true);
      setData(nextData);
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(nextData));
        localStorage.setItem(LOCAL_STORAGE_TS_KEY, String(Date.now()));
      } catch {
        // ignore storage quota warning
      }

      try {
        const res = await fetch('/api/portfolio', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-passcode': adminPasscode || 'phd2027',
          },
          body: JSON.stringify(nextData),
        });
        if (res.ok) {
          const json = await res.json();
          if (json && json.data && json.data.profile) {
            setData(json.data);
            try {
              localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(json.data));
            } catch {
              // ignore
            }
          }
        }
        const timestamp = new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });
        setLastSavedAt(timestamp);
        setIsSaving(false);
        return res.ok;
      } catch {
        const timestamp = new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });
        setLastSavedAt(timestamp);
        setIsSaving(false);
        return true;
      }
    },
    [adminPasscode]
  );

  const resetToDefaults = useCallback(async () => {
    setIsSaving(true);
    setData(DEFAULT_PORTFOLIO_DATA);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEFAULT_PORTFOLIO_DATA));
      localStorage.setItem(LOCAL_STORAGE_TS_KEY, String(Date.now()));
      await fetch('/api/portfolio/reset', {
        method: 'POST',
        headers: {
          'x-admin-passcode': adminPasscode || 'phd2027',
        },
      });
    } catch {
      // ignore offline error
    } finally {
      setLastSavedAt(new Date().toLocaleTimeString());
      setIsSaving(false);
    }
  }, [adminPasscode]);

  const exportDatabaseJson = useCallback(() => {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'phd-portfolio-database.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [data]);

  const importDatabaseJson = useCallback(
    async (jsonString: string): Promise<boolean> => {
      try {
        const parsed: PortfolioDatabase = JSON.parse(jsonString);
        if (!parsed || !parsed.profile || !Array.isArray(parsed.projects)) {
          return false;
        }
        return await savePortfolioData(parsed);
      } catch {
        return false;
      }
    },
    [savePortfolioData]
  );

  return (
    <PortfolioContext.Provider
      value={{
        data,
        isLoading,
        isSaving,
        lastSavedAt,
        isAdminAuthenticated,
        adminPasscode,
        verifyAdminPasscode,
        logoutAdmin,
        savePortfolioData,
        resetToDefaults,
        exportDatabaseJson,
        importDatabaseJson,
      }}
    >
      {children}
    </PortfolioContext.Provider>
  );
};

export function usePortfolio() {
  const ctx = useContext(PortfolioContext);
  if (!ctx) {
    throw new Error('usePortfolio must be used within a PortfolioProvider');
  }
  return ctx;
}
