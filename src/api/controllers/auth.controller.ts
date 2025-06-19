import { Request, Response, NextFunction } from 'express';
import { register_user } from '../../services/auth.service';
import { RegisterInput } from '../../schemas/auth.schema';

export const register_handler = async (
  req: Request<RegisterInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await register_user(req.body);

    res.status(201).json({
      status: 'success',
      data: result,
    });
  } catch (error: any) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      res.status(409).json({
        status: 'fail',
        email: 'A user with this email or username already exists.',
      });
      return;
    }
    next(error);
  }
};
