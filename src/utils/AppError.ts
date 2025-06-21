/* eslint-disable @typescript-eslint/naming-convention */
export class AppError extends Error {
  public statusCode: number;

  public status: 'fail' | 'error';

  public isOperational: boolean;

  public code?: string;

  constructor(message: string, statusCode: number, code?: string) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.code = code;

    Error.captureStackTrace(this, this.constructor);
  }
}