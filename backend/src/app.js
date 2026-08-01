import express from 'express';
import cors from 'cors';
import routes from './routes.js';
import morgan from 'morgan';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api', routes);

export default app;
