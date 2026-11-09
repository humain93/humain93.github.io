import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { PortfolioDatabase } from '../types/portfolio';
import { DEFAULT_PORTFOLIO_DATA } from '../data/defaultPortfolioData';

const LOCAL_STORAGE_KEY = 'phd_research_portfolio_db_v6';
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
        return JSON.parse(cached);
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
    async function fetchServerPortfolio() {
      try {
        const res = await fetch('/api/portfolio');
        if (res.ok) {
          const contentType = res.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const serverData: PortfolioDatabase = await res.json();
            if (mounted && serverData && serverData.profile) {
              setData(serverData);
              try {
                localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(serverData));
              } catch {
                // ignore quota error
              }
              return;
            }
          }
        }
      } catch {
        // Running on static host (e.g., GitHub Pages) without Express backend
      }

      // Static GitHub Pages fallback: fetch ./data/portfolio.json if available
      try {
        const staticRes = await fetch(`./data/portfolio.json?t=${Date.now()}`);
        if (staticRes.ok) {
          const contentType = staticRes.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const staticData: PortfolioDatabase = await staticRes.json();
            if (mounted && staticData && staticData.profile) {
              setData(staticData);
              try {
                localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(staticData));
              } catch {
                // ignore quota error
              }
            }
          }
        }
      } catch {
        // Fallback to localStorage / compiled DEFAULT_PORTFOLIO_DATA
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    fetchServerPortfolio();
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
      // Static fallback if backend route isn't active
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
