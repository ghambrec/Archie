//import {config as loadEnv } from 'dotenv';
//import {resolve } from 'path';


import { DataSource } from 'typeorm';
import { loadDatabaseConfig } from '../config/database.config';

import { User } from '../modules/users/entities/user.entity';

const config = loadDatabaseConfig();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: config.host,
  port: config.port,
  username: config.username,
  password: config.password,
  database: config.dbName,
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/database/migrations/*.ts'],
});

export default AppDataSource;
