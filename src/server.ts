import app from './app';
import config from './config';
import sequelize from './lib/sequelize';

(async () => {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');

    app.listen(config.port, () => {
      console.log(`Server is running on http://localhost:${config.port}`);
      console.log('Nodemon is active and watching for changes. Press Ctrl-C to stop.');
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();