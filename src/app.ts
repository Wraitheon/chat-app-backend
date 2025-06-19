import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookie_parser from 'cookie-parser';
import api_routes from './api/routes';
// import { errorHandler } from './middleware/error.handler';

const app = express();

// Core Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));
app.use(helmet()); // Set security-related HTTP headers
app.use(cookie_parser());
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// API Routes
app.use('/api', api_routes);

// // Global Error Handler
// app.use(errorHandler);

export default app;
