import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cookieParser from 'cookie-parser';
import { config } from './config.js';
import authRoutes from './routes/auth.js';
import disputeRoutes from './routes/disputes.js';
import jobRoutes from './routes/jobs.js';
import milestoneRoutes from './routes/milestones.js';
import projectRoutes from './routes/projects.js';
import { HttpError } from './http.js';

export const app = express();

app.disable('x-powered-by');

if (!config.isTest) {
  app.use((req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(
        `${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`,
      );
    });

    next();
  });
}

app.use(express.json({ limit: '100kb' }));

app.use(cookieParser());

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'buildbond-api' });
});

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/projects/:projectId/milestones', milestoneRoutes);
app.use('/api/projects/:projectId/disputes', disputeRoutes);

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not found.' });
});

// When the frontend has been built (npm run build:web), this process serves it
// too, so the deployed app runs on one origin: the page and /api share a host,
// which keeps the session cookie first-party and needs no CORS policy. During
// development the built folder usually does not exist and vite serves the page.
const webDist = process.env.WEB_DIST
  ? path.resolve(process.env.WEB_DIST)
  : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../web/dist');

if (existsSync(path.join(webDist, 'index.html'))) {
  app.use(express.static(webDist, { index: false }));

  app.use((req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      return next();
    }

    res.sendFile(path.join(webDist, 'index.html'));
  });

  console.log(`Serving the built frontend from ${webDist}`);
}

app.use((error, req, res, next) => {

  if (res.headersSent) {
    return next(error);
  }

  if (error instanceof HttpError) {
    return res.status(error.status).json({ error: error.message });
  }

  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'The request body must be valid JSON.' });
  }

  if (error.type === 'entity.too.large') {
    return res.status(413).json({ error: 'The request body is too large.' });
  }

  if (error.code === '23505') {
    return res.status(409).json({
      error: 'That action conflicts with the current state. Please refresh and try again.',
    });
  }

  console.error('Unhandled error:', error);
  return res.status(500).json({ error: 'Something went wrong on the server.' });
});