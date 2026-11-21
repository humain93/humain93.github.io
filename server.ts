import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLIC_DATA_DIR = path.join(__dirname, 'public', 'data');
const PUBLIC_JSON_FILE = path.join(PUBLIC_DATA_DIR, 'portfolio.json');
const DEFAULT_TS_FILE = path.join(__dirname, 'src', 'data', 'defaultPortfolioData.ts');

let runtimeAdminPasscode = process.env.ADMIN_PASSCODE || 'phd2027';

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

async function readPortfolioData(): Promise<unknown> {
  try {
    if (fs.existsSync(PUBLIC_JSON_FILE)) {
      const content = fs.readFileSync(PUBLIC_JSON_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.warn('Error reading public/data/portfolio.json, falling back to defaultPortfolioData.ts:', err);
  }
  const mod = await import('./src/data/defaultPortfolioData.ts');
  return mod.DEFAULT_PORTFOLIO_DATA;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Bind port 3000 immediately before loading Vite so container health checks succeed instantaneously
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Academic Research Portfolio & CMS server listening on http://localhost:${PORT}`);
  });

  // Increase payload limit to support base64 image & CV PDF uploads in CMS
  app.use(express.json({ limit: '25mb' }));

  app.get('/api/portfolio', async (_req, res) => {
    try {
      const data = await readPortfolioData();
      res.json(data);
    } catch (err) {
      console.error('Error reading portfolio database:', err);
      res.status(500).json({ error: 'Failed to load portfolio data.' });
    }
  });

  app.post('/api/auth/verify', (req, res) => {
    const { passcode } = req.body || {};
    if (passcode === runtimeAdminPasscode) {
      res.json({ authenticated: true });
    } else {
      res.status(401).json({ authenticated: false, error: 'Invalid admin passcode.' });
    }
  });

  app.post('/api/auth/update-passcode', (req, res) => {
    const { currentPasscode, newPasscode } = req.body || {};
    if (currentPasscode !== runtimeAdminPasscode) {
      res.status(401).json({ error: 'Current passcode is incorrect.' });
      return;
    }
    if (!newPasscode || typeof newPasscode !== 'string' || newPasscode.trim().length < 4) {
      res.status(400).json({ error: 'New passcode must be at least 4 characters.' });
      return;
    }
    runtimeAdminPasscode = newPasscode.trim();
    res.json({ success: true });
  });

  app.put('/api/portfolio', (req, res) => {
    try {
      const providedPasscode = req.headers['x-admin-passcode'] as string | undefined;
      if (providedPasscode && providedPasscode !== runtimeAdminPasscode) {
        res.status(401).json({ error: 'Unauthorized CMS write attempt.' });
        return;
      }
      const updatedData = req.body;
      if (!updatedData || !updatedData.profile || !Array.isArray(updatedData.projects)) {
        res.status(400).json({ error: 'Invalid portfolio payload structure.' });
        return;
      }
      syncStaticSourceFiles(updatedData);
      res.json({ success: true, data: updatedData });
    } catch (err) {
      console.error('Error saving portfolio database:', err);
      res.status(500).json({ error: 'Failed to persist portfolio data.' });
    }
  });

  app.post('/api/portfolio/reset', async (req, res) => {
    try {
      const providedPasscode = req.headers['x-admin-passcode'] as string | undefined;
      if (providedPasscode && providedPasscode !== runtimeAdminPasscode) {
        res.status(401).json({ error: 'Unauthorized reset attempt.' });
        return;
      }
      const mod = await import('./src/data/defaultPortfolioData.ts');
      syncStaticSourceFiles(mod.DEFAULT_PORTFOLIO_DATA);
      res.json({ success: true, data: mod.DEFAULT_PORTFOLIO_DATA });
    } catch (err) {
      console.error('Error resetting portfolio database:', err);
      res.status(500).json({ error: 'Failed to reset portfolio data.' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vitePromise = import('vite').then(({ createServer }) =>
      createServer({
        server: { middlewareMode: true },
        appType: 'spa',
      })
    );
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
}

startServer();
