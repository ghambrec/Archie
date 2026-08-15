import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { randomUUID } from 'crypto';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { ApplicationExceptionFilter } from '../src/common/errors/application-exception.filter';
import { ErrorCode } from '../src/common/errors/error-code';
import { User } from '../src/modules/users/entities/user.entity';
import { Group } from '../src/modules/groups/entities/group.entity';

const randomEmail = () => `e2e-${randomUUID()}@example.com`;
const randomDisplayName = () => `e2e-${randomUUID()}`;

describe('AuthController (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;

  const testPassword = 'password1234';
  const statusCodeCreated = 201;
  const statusCodeConflict = 409;

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
    let usedEmails: string[];

    beforeEach(() => {
      usedEmails = [];
    });

    afterEach(async () => {
      for (const email of usedEmails) {
        const user = await dataSource.manager.findOneBy(User, { email });
        if (user) {
          await dataSource.manager.delete(User, { id: user.id });
          await dataSource.manager.delete(Group, { name: `personal-${user.id}` });
        }
      }
    });

    it('creates the user and returns a session cookie', async () => {
      const email = randomEmail();
      const displayName = randomDisplayName();
      usedEmails.push(email);

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email, password: testPassword, displayName })
        .expect(statusCodeCreated);

      expect(response.headers['set-cookie']).toBeDefined();

      const createdUser = await dataSource.manager.findOneByOrFail(User, { email });
      expect(createdUser.displayName).toBe(displayName);
    });

    it('throws a conflict error when the email is already registered', async () => {
      const email = randomEmail();
      usedEmails.push(email);

      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email, password: testPassword, displayName: randomDisplayName() })
        .expect(statusCodeCreated);

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email, password: testPassword, displayName: randomDisplayName() })
        .expect(statusCodeConflict);

      expect(response.body).toMatchObject({
        statusCode: statusCodeConflict,
        code: ErrorCode.EmailAlreadyRegistered,
      });
    });

    it('throws a conflict error when the display name is already registered', async () => {
      const displayName = randomDisplayName();
      const firstEmail = randomEmail();
      const secondEmail = randomEmail();

      usedEmails.push(firstEmail, secondEmail);

      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: firstEmail, password: testPassword, displayName })
        .expect(statusCodeCreated);

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: secondEmail, password: testPassword, displayName })
        .expect(statusCodeConflict);

      expect(response.body).toMatchObject({
        statusCode: statusCodeConflict,
        code: ErrorCode.UserNameAlreadyRegistered,
      });
    });
  });
});
