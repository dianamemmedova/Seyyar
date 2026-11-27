import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config';
import { requestId } from './middleware/request-id';
import { timing } from './middleware/timing';
import { errorHandler, notFound } from './middleware/error-handler';
import { prisma } from './lib/prisma';
import authRoutes from './routes/auth.routes';
import homeRoutes from './routes/home.routes';
import placesRoutes from './routes/places.routes';

const app = express();

// 1. Every request gets an ID and is timed
app.use(requestId);
app.use(timing);

// 2. Security and parsing
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: config.CORS_ORIGINS, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// 3. Routes
app.get('/api/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', db: 'ok', uptime: Math.round(process.uptime()) });
  } catch {
    res.status(503).json({ status: 'error', db: 'down' });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/home', homeRoutes);
app.use('/api/places', placesRoutes);

// 4. These two always stay at the very end, after all routes
app.use(notFound);
app.use(errorHandler);

export default app;
