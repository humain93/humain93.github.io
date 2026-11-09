import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { DEFAULT_PORTFOLIO_DATA } from './src/data/defaultPortfolioData.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const PUBLIC_DATA_DIR = path.join(__dirname, 'public', 'data');
const DB_FILE = path.join(DATA_DIR, 'portfolio-db-v6.json');
const PUBLIC_JSON_FILE = path.join(PUBLIC_DATA_DIR, 'portfolio.json');
const DEFAULT_TS_FILE = path.join(__dirname, 'src', 'data', 'defaultPortfolioData.ts');
const PASSCODE_FILE = path.join(DATA_DIR, 'admin-auth.json');

function syncStaticSourceFiles(portfolioData: unknown) {
  try {
    if (!fs.existsSync(PUBLIC_DATA_DIR)) {
      fs.mkdirSync(PUBLIC_DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(PUBLIC_JSON_FILE, JSON.stringify(portfolioData, null, 2), 'utf-8');
    const tsContent = `import { PortfolioDatabase } from '../types/portfolio';\n\nexport const DEFAULT_PORTFOLIO_DATA: PortfolioDatabase = ${JSON.stringify(
      portfolioData,
      null,
      2
    )};\n`;
    fs.writeFileSync(DEFAULT_TS_FILE, tsContent, 'utf-8');
  } catch (err) {
    console.warn('Could not sync static source files:', err);
  }
}

function ensureDataFiles() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(PUBLIC_DATA_DIR)) {
    fs.mkdirSync(PUBLIC_DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_PORTFOLIO_DATA, null, 2), 'utf-8');
  } else {
    try {
      const existing = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      let updated = false;
      if (!existing.projectCategories && DEFAULT_PORTFOLIO_DATA.projectCategories) {
        existing.projectCategories = DEFAULT_PORTFOLIO_DATA.projectCategories;
        updated = true;
      }
      if (!existing.simulationsConfig && DEFAULT_PORTFOLIO_DATA.simulationsConfig) {
        existing.simulationsConfig = DEFAULT_PORTFOLIO_DATA.simulationsConfig;
        updated = true;
      }
      if (!existing.sectionControls && DEFAULT_PORTFOLIO_DATA.sectionControls) {
        existing.sectionControls = DEFAULT_PORTFOLIO_DATA.sectionControls;
        updated = true;
      }
      if (updated) {
        fs.writeFileSync(DB_FILE, JSON.stringify(existing, null, 2), 'utf-8');
      }
    } catch {
      // ignore parse errors
    }
  }
  if (!fs.existsSync(PUBLIC_JSON_FILE)) {
    fs.writeFileSync(PUBLIC_JSON_FILE, JSON.stringify(DEFAULT_PORTFOLIO_DATA, null, 2), 'utf-8');
  }
  if (!fs.existsSync(PASSCODE_FILE)) {
    const initialPasscode = process.env.ADMIN_PASSCODE || 'phd2027';
    fs.writeFileSync(PASSCODE_FILE, JSON.stringify({ passcode: initialPasscode }, null, 2), 'utf-8');
  }
}

function getAdminPasscode(): string {
  try {
    ensureDataFiles();
    const raw = fs.readFileSync(PASSCODE_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return parsed.passcode || 'phd2027';
  } catch {
    return 'phd2027';
  }
}

async function startServer() {
  ensureDataFiles();
  const app = express();
  const PORT = 3000;

  // Increase payload limit to support base64 image & CV PDF uploads in CMS
  app.use(express.json({ limit: '25mb' }));

  app.get('/api/portfolio', (_req, res) => {
    try {
      ensureDataFiles();
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      res.json(JSON.parse(content));
    } catch (err) {
      console.error('Error reading portfolio database:', err);
      res.json(DEFAULT_PORTFOLIO_DATA);
    }
  });

  app.post('/api/auth/verify', (req, res) => {
    const { passcode } = req.body || {};
    const expected = getAdminPasscode();
    if (passcode === expected) {
      res.json({ authenticated: true });
    } else {
      res.status(401).json({ authenticated: false, error: 'Invalid admin passcode.' });
    }
  });

  app.post('/api/auth/update-passcode', (req, res) => {
    const { currentPasscode, newPasscode } = req.body || {};
    const expected = getAdminPasscode();
    if (currentPasscode !== expected) {
      res.status(401).json({ error: 'Current passcode is incorrect.' });
      return;
    }
    if (!newPasscode || typeof newPasscode !== 'string' || newPasscode.trim().length < 4) {
      res.status(400).json({ error: 'New passcode must be at least 4 characters.' });
      return;
    }
    fs.writeFileSync(PASSCODE_FILE, JSON.stringify({ passcode: newPasscode.trim() }, null, 2), 'utf-8');
    res.json({ success: true });
  });

  app.put('/api/portfolio', (req, res) => {
    try {
      const providedPasscode = req.headers['x-admin-passcode'] as string | undefined;
      const expected = getAdminPasscode();
      if (providedPasscode && providedPasscode !== expected) {
        res.status(401).json({ error: 'Unauthorized CMS write attempt.' });
        return;
      }
      const updatedData = req.body;
      if (!updatedData || !updatedData.profile || !Array.isArray(updatedData.projects)) {
        res.status(400).json({ error: 'Invalid portfolio payload structure.' });
        return;
      }
      ensureDataFiles();
      fs.writeFileSync(DB_FILE, JSON.stringify(updatedData, null, 2), 'utf-8');
      syncStaticSourceFiles(updatedData);
      res.json({ success: true, data: updatedData });
    } catch (err) {
      console.error('Error saving portfolio database:', err);
      res.status(500).json({ error: 'Failed to persist portfolio data.' });
    }
  });

  app.post('/api/portfolio/reset', (req, res) => {
    try {
      const providedPasscode = req.headers['x-admin-passcode'] as string | undefined;
      const expected = getAdminPasscode();
      if (providedPasscode && providedPasscode !== expected) {
        res.status(401).json({ error: 'Unauthorized reset attempt.' });
        return;
      }
      ensureDataFiles();
      fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_PORTFOLIO_DATA, null, 2), 'utf-8');
      syncStaticSourceFiles(DEFAULT_PORTFOLIO_DATA);
      res.json({ success: true, data: DEFAULT_PORTFOLIO_DATA });
    } catch (err) {
      console.error('Error resetting portfolio database:', err);
      res.status(500).json({ error: 'Failed to reset portfolio data.' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vitePromise = createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(async (req, res, next) => {
      try {
        const vite = await vitePromise;
        vite.middlewares(req, res, next);
      } catch (err) {
        next(err);
      }
    });
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Start listening on PORT 3000 immediately so the container health check succeeds without delay
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Academic Research Portfolio & CMS server listening on http://localhost:${PORT}`);
  });
}

startServer();
