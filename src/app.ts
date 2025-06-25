import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookie_parser from 'cookie-parser';
import path from 'path'
import api_routes from './api/routes';
import error_handler from './middleware/error.middleware';
// import { errorHandler } from './middleware/error.handler';

const app = express();

// Core Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));
app.use(helmet({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cookie_parser());
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

app.use(express.static(path.join(__dirname, '..', 'public')));

// API Routes
app.use('/api', api_routes);
app.use(error_handler);

// // Global Error Handler
// app.use(errorHandler);

export default app;
