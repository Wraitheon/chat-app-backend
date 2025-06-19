import { Sequelize } from 'sequelize';
import config from '../config';

const sequelize = new Sequelize(config.database_url, {
  dialect: 'postgres',
  logging: false,
});

export default sequelize;
