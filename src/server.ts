import app from './app';
import config from './config';
import sequelize from './lib/sequelize';

/**
 * The main entry point for the application.
 * It initializes the database connection and starts the Express server.
 */
const start_server = async () => {
  try {
    // 1. Test the database connection on startup.
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');

    // 2. Start the Express server to listen for incoming HTTP requests.
    app.listen(config.port, () => {
      console.log(`Server is running on http://localhost:${config.port}`);
    });
  } catch (error) {
    // 3. If the database connection or server start fails, log the error and exit.
    console.error('Unable to start server:', error);
    process.exit(1);
  }
};

// Execute the server start function.
start_server();
