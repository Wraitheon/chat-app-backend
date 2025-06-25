import { Request, Response, NextFunction } from 'express';
import sequelize from 'sequelize';
import { ZodError } from 'zod';
import { AppError } from '../utils/AppError';
import { ErrorResponse } from '../types/response.types';

const send_error = (err: AppError, res: Response) => {
  const response_body: ErrorResponse = {
    success: false,
    error: {
      message: err.message,
      status_code: err.statusCode,
    },
  };

  // Add the programmatic code if it exists
  if (err.code) {
    response_body.error.code = err.code;
  }

  if (!err.isOperational) {
    console.error('💥 UNEXPECTED ERROR:', err);
    response_body.error.message = 'Something went very wrong.';
  }

  return res.status(err.statusCode).json(response_body);
};

const error_handler = (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  let processed_error: AppError;

  // Sequelize error
  if (
    typeof err === 'object' &&
    err !== null &&
    'name' in err &&
    err.name === 'SequelizeUniqueConstraintError'
  ) {
    const sq_error = err as sequelize.UniqueConstraintError;
    const message = `Duplicate field value: ${Object.values(sq_error.fields)[0]}. Please use another value.`;
    processed_error = new AppError(message, 400);
  }

  // Zod error
  else if (
    typeof err === 'object' &&
    err !== null &&
    'name' in err &&
    err.name === 'ZodError'
  ) {
    const zod_error = err as ZodError;
    const message = `Validation error: ${zod_error.errors.map(e => e.message).join(', ')}`;
    processed_error = new AppError(message, 400);
  }

  // AppError
  else if (err instanceof AppError) {
    processed_error = err;
  }

  // Unknown error
  else {
    const fallback_error = err instanceof Error ? err : new Error('Unexpected error');
    processed_error = new AppError(fallback_error.message, 500);
    processed_error.isOperational = false;
  }

  send_error(processed_error, res);
};

export default error_handler;