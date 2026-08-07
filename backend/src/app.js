import express from 'express';
import cors from 'cors';
import routes from './routes.js';
import morgan from 'morgan';
import { errorHandler } from './errorHandler.js';
import helmet from 'helmet';
import { apiLimiter } from './middleware.js';

const app = express();

const allowedOrigins =
  process.env.NODE_ENV === 'production'
    ? [process.env.FRONTEND_URL]
    : ['http://localhost:3000'];

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
