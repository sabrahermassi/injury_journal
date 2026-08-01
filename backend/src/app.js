import express from 'express';
import cors from 'cors';
import routes from './routes.js';
import morgan from 'morgan';
import { errorHandler } from './errorHandler.js';
import helmet from 'helmet';
import { apiLimiter } from './middleware.js';

const app = express();

const corsOptions = {
  origin: process.env.FRONTEND_URL,
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

// Error handler
app.use(errorHandler);

export default app;
