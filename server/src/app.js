import express from 'express';
import cookieParser from 'cookie-parser';
import { HttpError } from './http.js';
import { authRouter } from './routes/auth.js';
import { projectsRouter } from './routes/projects.js';
import { jobsRouter } from './routes/jobs.js';
import { milestonesRouter } from './routes/milestones.js';
import { disputesRouter } from './routes/disputes.js';

export const app = express();
app.use(express.json());
app.use(cookieParser());
app.get('/api/health', (_request, response) => response.json({ ok: true }));
app.use('/api/auth', authRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/jobs', jobsRouter);
app.use('/api/projects', milestonesRouter);
app.use('/api/projects', disputesRouter);
app.use((_request, _response, next) => next(new HttpError(404, 'Not found')));
app.use((error, _request, response, _next) => {
  const status = error.status || 500;
  response.status(status).json({ error: error.message || 'Internal server error' });
});
