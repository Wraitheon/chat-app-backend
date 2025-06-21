import { Request, Response, NextFunction } from 'express';
import { register_user, login_user } from '../../services/auth.service';
import { RegisterInput, LoginInput } from '../../schemas/auth.schema';
import { send_success } from '../../utils/response.handler';

export const register_handler = async (
  req: Request<RegisterInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await register_user(req.body);

    send_success(res, 201, result);
  } catch (err) {
    next(err)
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

    send_success(res, 200, { user, token });
  } catch (err) {
    next(err);
  }
};
