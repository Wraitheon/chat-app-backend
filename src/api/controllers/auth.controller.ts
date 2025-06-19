import { Request, Response, NextFunction } from 'express';
import { register_user, login_user } from '../../services/auth.service';
import { RegisterInput, LoginInput } from '../../schemas/auth.schema';

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
  } catch (err) {
    const error = err as Error;
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

export const login_handler = async (
  req: Request<LoginInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await login_user(req.body);

    res.status(201).json({
      status: 'success',
      data: result,
    });
  } catch (err) {
    const error = err as Error;
    if (error.message === 'Invalid credentials') {
      res.status(409).json({
        status: 'fail',
        message: 'Invalid credentials. Please check your email/username and password.',
      });
      return;
    }

    next(error);
  }
}