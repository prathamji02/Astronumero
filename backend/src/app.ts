import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { env } from './config/environment.ts';
import { authRouter } from './modules/auth/authController.ts';
import { userRouter } from './modules/users/userController.ts';
import { subscriptionRouter } from './modules/subscriptions/subscriptionController.ts';
import { savedChartsRouter } from './modules/saved-charts/savedChartsController.ts';
import { numerologyRouter } from './modules/numerology/numerologyController.ts';
import { adminRouter } from './modules/admin/adminController.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createApp(): express.Application {
  const app = express();

  // CORS configuration
  app.use(
    cors({
      origin: [env.FRONTEND_URL, 'http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-session-token'],
    })
  );

  app.use(express.json({ limit: '5mb' }));

  // API Health Check
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      platform: 'Premium Numerology Platform',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
  });

  // Mount Feature Modules
  app.use('/api/auth', authRouter);
  app.use('/api/user', userRouter);
  app.use('/api/subscriptions', subscriptionRouter);
  app.use('/api/charts', savedChartsRouter);
  app.use('/api/numerology', numerologyRouter);
  app.use('/api/admin', adminRouter);

  // Centralized Error Handling
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[SERVER ERROR]', err);
    res.status(err.status || 500).json({
      error: err.code || 'INTERNAL_SERVER_ERROR',
      message: err.message || 'An unexpected error occurred.',
    });
  });

  // Serve static frontend files in production
  const frontendDist = path.resolve(__dirname, '../../frontend/dist');
  if (fs.existsSync(frontendDist)) {
    app.use(express.static(frontendDist));
    app.get('*', (req: Request, res: Response, next: NextFunction) => {
      if (req.path.startsWith('/api')) {
        return next();
      }
      res.sendFile(path.join(frontendDist, 'index.html'));
    });
  }

  return app;
}
