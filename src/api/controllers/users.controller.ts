import { Request, Response, NextFunction } from "express";
import { get_user_by_id, update_user_profile, search_for_users } from "../../services/users.services";
import { SearchUsersQuery } from "../../schemas/user.schema";
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
    const user_id = req.user!.id;
    const update_data = req.body;

    const updated_user = await update_user_profile(user_id, update_data);

    send_success(res, 200, { user: updated_user });
  } catch (error) {
    next(error)
  }
};

export const search_users_handler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const current_user_id = req.user!.id;
    const search_query = req.query as SearchUsersQuery;

    const users = await search_for_users(current_user_id, search_query);

    send_success(res, 200, {
      results: users.length,
      users,
    });
  } catch (error) {
    next(error);
  }
};