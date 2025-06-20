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
    const { user, token } = await login_user(req.body);

    res.cookie('token', token, {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      httpOnly: true,
      secure: false,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      maxAge: 24 * 60 * 60 * 1000,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      sameSite: 'strict',
    });

    res.status(200).json({
      status: 'success',
      data: { user, token },
    });
  } catch (err) {
    const error = err as Error;
    if (error.message === 'Invalid credentials') {
      res.status(401).json({
        status: 'fail',
        message: 'Invalid credentials. Please check your identifier and password.',
      });
      return;
    }

    next(error);
  }
};
