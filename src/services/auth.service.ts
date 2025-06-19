import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { QueryTypes } from 'sequelize';
import { RegisterInput } from '../schemas/auth.schema';
import sequelize from '../lib/sequelize';
import config from '../config';

interface UserQueryResult {
  id: string;
  username: string;
  email: string;
  display_name: string;
  display_picture_url: string | null;
  status_message: string | null;
}

export const register_user = async (input: RegisterInput) => {
  const { username, email, password, display_name } = input;

  const password_hash = await bcrypt.hash(password, 10);

  const insert_query = `
    INSERT INTO "users" (username, email, password_hash, display_name)
    VALUES (:username, :email, :password_hash, :display_name)
    RETURNING id, username, email, display_name, display_picture_url, status_message;
  `;

  const [results] = (await sequelize.query(insert_query, {
    replacements: {
      username,
      email,
      password_hash,
      display_name,
    },
    type: QueryTypes.INSERT,
  })) as unknown as [UserQueryResult[]];

  const new_user = results[0];

  if (!new_user) {
    throw new Error('User creation failed, no data returned.');
  }

  const token = jwt.sign(
    { id: new_user.id, email: new_user.email },
    config.jwt.secret,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    { expiresIn: config.jwt.expires_in } as jwt.SignOptions
  );

  return { user: new_user, token };
};
