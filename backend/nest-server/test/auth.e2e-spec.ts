import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { randomUUID } from 'crypto';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { ApplicationExceptionFilter } from '../src/common/errors/application-exception.filter';
import { User } from '../src/modules/users/entities/user.entity';
import { Group } from '../src/modules/groups/entities/group.entity';

describe('AuthController (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new ApplicationExceptionFilter());
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    dataSource = moduleFixture.get(DataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/register', () => {
    const email = `e2e-${randomUUID()}@example.com`;
    const displayName = `e2e-${randomUUID()}`;

    afterEach(async () => {
      const user = await dataSource.manager.findOneBy(User, { email });
      if (user) {
        await dataSource.manager.delete(User, { id: user.id });
        await dataSource.manager.delete(Group, { name: `personal-${user.id}` });
      }
    });

    it('creates the user and returns a session cookie', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email, password: 'password1234', displayName })
        .expect(201);

      expect(response.headers['set-cookie']).toBeDefined();

      const createdUser = await dataSource.manager.findOneByOrFail(User, { email });
      expect(createdUser.displayName).toBe(displayName);
    });
  });
});
