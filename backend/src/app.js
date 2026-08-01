import express from 'express';
import cors from 'cors';
import routes from './routes.js';
import morgan from 'morgan';
import { errorHandler } from './errorHandler.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api', routes);

// Error handler
app.use(errorHandler);

export default app;
