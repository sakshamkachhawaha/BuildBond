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