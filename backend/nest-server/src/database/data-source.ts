import 'dotenv/config';
import { DataSource } from 'typeorm';
import { loadDatabaseConfig } from 'src/config/database.config';

import { User } from '../modules/users/entities/user.entity';

const config = loadDatabaseConfig();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: config.host,
  port: config.port,
  username: config.username,
  password: config.password,
  database: config.dbName,
  entities: [User],
  migrations: ['src/database/migrations/*.ts'],
});

export default AppDataSource;
