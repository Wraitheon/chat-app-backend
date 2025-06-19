import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { QueryTypes } from 'sequelize';
import { RegisterInput, LoginInput } from '../schemas/auth.schema';
import sequelize from '../lib/sequelize';
import config from '../config';


type UserQueryResult = {
  id: string;
  username: string;
  email: string;
  display_name: string;
  display_picture_url: string | null;
  status_message: string | null;
}

type UserWithPassword = UserQueryResult & {
  password_hash: string;
};

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

export const login_user = async (input: LoginInput) => {
  const { identifier, password } = input;

  const is_email = identifier.includes('@');

  let where_clause: string;
  if (is_email) {
    where_clause = 'email = :identifier';
  }
  else {
    where_clause = 'username = :identifier';
  }

  const find_user_query = `
  SELECT * FROM "users" WHERE ${where_clause}
  `;

  const [user] = await sequelize.query<UserWithPassword>(find_user_query, {
    replacements: { identifier },
    type: QueryTypes.SELECT
  });

  if (!user) {
    throw new Error('Invalid credentials');
  }

  const is_password_valid = await bcrypt.compare(password, user.password_hash);

  if (!is_password_valid) {
    throw new Error('Invalid credentials');
  }

  const token = jwt.sign(
    { id: user.id, email: user.email },
    config.jwt.secret,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    { expiresIn: config.jwt.expires_in } as jwt.SignOptions
  )

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password_hash, ...user_without_password } = user;

  return { user: user_without_password, token };
}