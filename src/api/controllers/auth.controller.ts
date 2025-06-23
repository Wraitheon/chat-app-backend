import { Request, Response, NextFunction } from 'express';
import { register_schema, login_schema } from '../../schemas/auth.schema';
import { register_user, login_user } from '../../services/auth.service';
import { send_success } from '../../utils/response.handler';

export const register_handler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { body } = await register_schema.parseAsync({
      body: req.body,
    });

    const result = await register_user(body);

    send_success(res, 201, result);
  } catch (err) {
    next(err);
  }
};

export const login_handler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { body } = await login_schema.parseAsync({
      body: req.body,
    });

    const { user, token } = await login_user(body);

    res.cookie('token', token, {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      // eslint-disable-next-line @typescript-eslint/naming-convention
      maxAge: 24 * 60 * 60 * 1000,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      sameSite: 'strict',
    });

    send_success(res, 200, { user, token });
  } catch (err) {
    next(err);
  }
};