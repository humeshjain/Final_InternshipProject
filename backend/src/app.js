import express from 'express';
import path from 'path';
import fs from 'fs';
import { config } from './config/env.js';
import { authRouter } from './routes/authRoutes.js';
import { aiRouter } from './routes/aiRoutes.js';
import { catalogRouter } from './routes/catalogRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

export async function createApp() {
  const app = express();
  app.use(express.json());

  // CORS Middleware for standalone frontend connections
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', config.corsOrigin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Mount API Routers
  app.use('/api/auth', authRouter);
  app.use('/api/catalog', catalogRouter);
  app.use('/api/categories', catalogRouter);
  app.use('/api', aiRouter);

  // Global Error Handler for backend APIs
  app.use(errorHandler);

  // Configure Frontend Dev Server / Static Dist Serving
  const distPath = path.resolve('dist');
  const indexPath = path.join(distPath, 'index.html');

  if (fs.existsSync(indexPath)) {
    app.use(express.static(distPath));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) {
        return next();
      }
      res.sendFile(indexPath);
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
      configFile: path.resolve('frontend/vite.config.js'),
      root: path.resolve('frontend')
    });
    app.use(vite.middlewares);
  }

  return app;
}
