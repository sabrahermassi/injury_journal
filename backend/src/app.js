import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import routes from './routes.js';
import morgan from 'morgan';
import { errorHandler } from './errorHandler.js';
import helmet from 'helmet';
import { apiLimiter } from './middleware.js';

const app = express();

// Render (and every other PaaS) terminates TLS at a proxy, so without this
// every request arrives from the same address and the rate limiters bucket
// the entire internet together. `1` = trust exactly one hop; trusting all of
// them would let a client forge X-Forwarded-For and escape limiting entirely.
app.set('trust proxy', 1);

const environment = process.env.NODE_ENV;
const frontendUrl = process.env.FRONTEND_URL?.trim();

if (!['development', 'test', 'production'].includes(environment)) {
  throw new Error('NODE_ENV must be explicitly set to a supported environment');
}

// FRONTEND_URL takes a comma-separated list so one deployment can allow more
// than one origin -- the web app on localhost plus a LAN address, which is how
// the app is opened on a real phone during development.
const configuredOrigins = (frontendUrl ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

if (environment === 'production' && configuredOrigins.length === 0) {
  throw new Error('FRONTEND_URL is required in production');
}

const allowedOrigins =
  configuredOrigins.length > 0 ? configuredOrigins : ['http://localhost:3000'];

const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
};

// Security middleware
app.use(helmet());

// Middleware
app.use(cors(corsOptions));

// Logging
app.use(morgan('dev'));

// Body parsing
app.use(express.json());
app.use(cookieParser());

if (process.env.NODE_ENV !== 'test') {
  app.use(apiLimiter);
}

// Routes
app.use('/api', routes);
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
  });
});

// Error handler
app.use(errorHandler);

export default app;
