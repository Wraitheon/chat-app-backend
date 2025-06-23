import { Request, Response, NextFunction } from "express";
import { update_user_schema, search_user_schema } from '../../schemas/user.schema';
import { get_user_by_id, update_user_profile, search_for_users } from "../../services/users.services";
import { send_success } from "../../utils/response.handler";

export const get_me_handler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user_id = req.user!.id;
    const user = await get_user_by_id(user_id);
    send_success(res, 200, { user });
  } catch (error) {
    next(error);
  }
};

export const update_profile_handler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { body: update_data } = await update_user_schema.parseAsync({
      body: req.body,
    });

    const user_id = req.user!.id;
    const updated_user = await update_user_profile(user_id, update_data);

    send_success(res, 200, { user: updated_user });
  } catch (error) {
    next(error);
  }
};

export const search_users_handler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { query: search_query } = await search_user_schema.parseAsync({
      query: req.query,
    });

    const current_user_id = req.user!.id;
    const users = await search_for_users(current_user_id, search_query);

    send_success(res, 200, {
      results: users.length,
      users,
    });
  } catch (error) {
    next(error);
  }
};