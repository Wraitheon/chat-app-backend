import { QueryTypes } from "sequelize";
import sequelize from "../lib/sequelize";
import { UpdateUserInput, SearchUsersQuery } from "../schemas/user.schema";
import { UserProfile } from '../types/user.types';
import { AppError } from "../utils/AppError";

export const get_user_by_id = async (id: string): Promise<UserProfile | null> => {
  const find_user_query = `
  SELECT id, username, email, display_name,
  display_picture_url, status_message
  FROM "users"
  WHERE id = :id
  `;

  const [user] = await sequelize.query<UserProfile>(find_user_query, {
    replacements: { id },
    type: QueryTypes.SELECT,
  });

  return user || null;
}

export const update_user_profile = async (id: string, input: UpdateUserInput): Promise<UserProfile> => {
  const { display_name, status_message, display_picture_url } = input;

  const fields_to_update: string[] = [];
  const replacements: Partial<Record<keyof UpdateUserInput | 'user_id', string | null>> = {
    user_id: id,
  };

  if (display_name !== undefined) {
    fields_to_update.push('display_name = :display_name');
    replacements.display_name = display_name;
  }
  if (status_message !== undefined) {
    fields_to_update.push('status_message = :status_message');
    replacements.status_message = status_message;
  }
  if (display_picture_url !== undefined) {
    fields_to_update.push('display_picture_url = :display_picture_url');
    replacements.display_picture_url = display_picture_url;
  }

  if (fields_to_update.length === 0) {
    throw new AppError(
      'No valid fields provided for update. Please supply a display_name, status_message, or display_picture_url.',
      400,
      'NO_UPDATE_FIELDS_PROVIDED'
    );
  }

  const update_query = `
    UPDATE "users"
    SET ${fields_to_update.join(', ')}, updated_at = NOW()
    WHERE id = :user_id
    RETURNING id, username, email, display_name, 
    display_picture_url, status_message, created_at;
  `;

  const updated_user = await sequelize.query<UserProfile>(update_query, {
    replacements,
    type: QueryTypes.SELECT,
    plain: true,
  });

  if (!updated_user) {
    throw new AppError(
      'No user found with the provided ID.',
      404,
      'USER_NOT_FOUND'
    );
  }

  return updated_user;
}

export const search_for_users = async (current_user_id: string, query: SearchUsersQuery): Promise<UserProfile[]> => {
  const { search } = query;

  const search_pattern = `%${search}%`;

  const search_query = `
    SELECT 
      id, username, email, display_name, 
      display_picture_url, status_message, created_at 
    FROM "users" 
    WHERE 
      (username ILIKE :search_pattern OR display_name ILIKE :search_pattern)
      AND id != :current_user_id
    LIMIT 10;
  `;

  const users = await sequelize.query<UserProfile>(search_query, {
    replacements: {
      search_pattern,
      current_user_id
    },
    type: QueryTypes.SELECT,
  });

  return users;
};