import express, { Request, Response, NextFunction } from 'express';
import { upload_picture } from './upload.middleware';

export const conditional_body_parser = (req: Request, res: Response, next: NextFunction) => {
  if (req.is('multipart/form-data')) {
    upload_picture.single('group_avatar')(req, res, next);
  } else {
    express.json()(req, res, next);
  }
};