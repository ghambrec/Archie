import 'dotenv/config';
import { DataSource } from 'typeorm';
import { User } from '../modules/users/entities/user.entity';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: Number(process.env.DATABASE_PORT) || 5432,
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  entities: [User],
  migrations: ['src/database/migrations/*.ts'],
});

export default AppDataSource;
