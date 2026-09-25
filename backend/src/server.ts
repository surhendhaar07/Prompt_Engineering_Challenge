import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import cors from 'cors';
import { config } from './config';
import { initDatabase } from './db';
import { seedDatabase } from './db/seed';
import { initSocketServer } from './socket';
import routes from './routes';
import { checkAndExpireChallenges } from './services/challengeService';

const app = express();
const server = http.createServer(app);

// Enable trust proxy for Render, Railway, Cloudflare, etc.
app.set('trust proxy', 1);

// CORS configuration
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.path !== '/api/challenges/time' && req.path !== '/api/health') {
    console.log(`[HTTP] ${req.method} ${req.path}`);
  }
  next();
});

import path from 'path';
import fs from 'fs';

// Mount API routes
app.use('/api', routes);

// Serve frontend build if available (for unified Render deployment)
const frontendDistPath = path.resolve(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDistPath)) {
  console.log(`[Server] Serving production frontend from ${frontendDistPath}`);
  app.use(express.static(frontendDistPath));
  app.get('*', (req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
      return next();
    }
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[Error] Unhandled error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error occurred',
  });
});

// Initialize Socket.IO
initSocketServer(server);

// Background challenge timer worker (runs every 4 seconds)
let expiryInterval: NodeJS.Timeout | null = null;

async function startServer() {
  try {
    console.log('----------------------------------------------------');
    console.log(`  XenTriX'26 - Prompt Engineering Challenge Server  `);
    console.log('----------------------------------------------------');

    await initDatabase();
    await seedDatabase();

    expiryInterval = setInterval(async () => {
      try {
        await checkAndExpireChallenges();
      } catch (err) {
        console.error('[Worker] Expiry check error:', err);
      }
    }, 4000);

    server.listen(config.port, () => {
      console.log(`[Server] Live on http://localhost:${config.port}`);
      console.log(`[Event]  ${config.event.symposiumName} | ${config.event.tagline}`);
      console.log(`[Auth]   Default Admin: ${config.defaultAdminUsername}`);
      console.log(`[Mode]   Timer Auto-Expiration Engine: ACTIVE (4s cycle)`);
    });
  } catch (err) {
    console.error('[Server] Fatal startup error:', err);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  if (expiryInterval) clearInterval(expiryInterval);
  server.close(() => {
    console.log('[Server] Gracefully stopped.');
    process.exit(0);
  });
});

startServer();
