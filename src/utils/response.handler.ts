import { Response } from 'express';
import { SuccessResponse } from '../types/response.types';


export const send_success = <T>(res: Response, status_code: number, data: T): void => {
  const response: SuccessResponse<T> = {
    success: true,
    data,
  };
  res.status(status_code).json(response);
};