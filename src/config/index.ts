import dotenv from 'dotenv';

dotenv.config();

interface Config {
  port: number;
  database_url: string;
  jwt: {
    secret: string;
    expires_in: string;
  };
}

const config: Config = {
  port: parseInt(process.env.PORT || '5005', 10),
  database_url: process.env.DATABASE_URL!,
  jwt: {
    secret: process.env.JWT_SECRET!,
    expires_in: process.env.JWT_EXPIRES_IN || '1h',
  },
};

if (!config.database_url || !config.jwt.secret) {
  console.error('FATAL ERROR: Missing critical environment variables.');
  process.exit(1);
}

export default config;
