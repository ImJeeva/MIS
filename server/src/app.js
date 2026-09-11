import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './env.js';
import { uploadRoot } from './middleware/upload.js';
import apiRoutes from './routes/index.js';
import { notFoundHandler, errorHandler } from './middleware/error.js';

export function createApp() {
  const app = express();

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors({ origin: env.clientOrigin, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

  // Avatars are low-sensitivity and shown via <img>; served statically.
  // Study files are NOT static — they go through /api/studies/:id/file with an
  // authorization check.
  app.use(
    '/uploads/avatars',
    express.static(`${uploadRoot}/avatars`, { fallthrough: false, maxAge: '7d' })
  );

  app.use('/api', apiRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
