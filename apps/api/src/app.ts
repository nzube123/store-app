import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import session from 'express-session';
import rateLimit from 'express-rate-limit';
import { prisma } from '@shop/database';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { AppError } from './lib/errors.js';
import { passport } from './lib/passport.js';
import { PrismaSessionStore } from './services/sessionStore.js';
import { apiRouter } from './routes/index.js';

export const app: Express = express();

if (env.isProduction) app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: env.frontendUrl, credentials: true, methods: ['GET', 'POST', 'OPTIONS'], allowedHeaders: ['Content-Type'] }));
app.use(express.json({ limit: '32kb' }));
app.use(session({
  name: 'cedar.sid',
  secret: env.sessionSecret,
  store: new PrismaSessionStore(prisma),
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: env.isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
}));
app.use(passport.initialize());
app.use(passport.session());

app.get('/api/health', (_request, response) => {
  response.json({ data: { status: 'ok', service: 'cedar-loom-api', timestamp: new Date().toISOString() } });
});
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 180, standardHeaders: 'draft-8', legacyHeaders: false }));
app.use('/api', apiRouter);
app.use('/api', (_request, _response, next) => next(new AppError('This API endpoint does not exist.', 404, 'NOT_FOUND')));
app.use(errorHandler);

export default app;
