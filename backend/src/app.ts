import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config';
import { requestId } from './middleware/request-id';
import { timing } from './middleware/timing';
import { errorHandler, notFound } from './middleware/error-handler';
import { apiLimiter } from './middleware/rate-limit';
import { prisma } from './lib/prisma';
import { uploadRoot } from './lib/images';
import authRoutes from './routes/auth.routes';
import homeRoutes from './routes/home.routes';
import placesRoutes from './routes/places.routes';
import requestsRoutes from './routes/requests.routes';
import favoritesRoutes from './routes/favorites.routes';
import reviewsRoutes from './routes/reviews.routes';
import transportRoutes from './routes/transport.routes';
import itinerariesRoutes from './routes/itineraries.routes';
import uploadsRoutes from './routes/uploads.routes';
import formsRoutes from './routes/forms.routes';

const app = express();

// Behind nginx the client IP comes in the X-Forwarded-For header
if (config.TRUST_PROXY) {
  app.set('trust proxy', 1);
}

// 1. Every request gets an ID and is timed
app.use(requestId);
app.use(timing);

// 2. Security and parsing
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: config.CORS_ORIGINS, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// 3. Uploaded images (file names are random, so they can be cached for a long time)
app.use('/uploads', express.static(uploadRoot, { maxAge: '30d', immutable: true, index: false }));

// 4. Routes
app.use('/api', apiLimiter);

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
app.use('/api/requests', requestsRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/routes', transportRoutes);
app.use('/api/itineraries', itinerariesRoutes);
app.use('/api/uploads', uploadsRoutes);
// /api/contact, /api/subscribe, /api/partners/apply, /api/faq
app.use('/api', formsRoutes);

// 5. These two always stay at the very end, after all routes
app.use(notFound);
app.use(errorHandler);

export default app;
