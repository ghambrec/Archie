import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { randomUUID } from 'crypto';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource, EntityManager } from 'typeorm';
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
  let usedEmails: string[];

  const testPassword = 'password1234';
  const wrotngPassword = 'wrong-password'
  const statusCodeOk = 200;
  const statusCodeCreated = 201;
  const statusCodeUnauthorized = 401;
  const statusCodeConflict = 409;
  const statusCodeTooManyRequests = 429;
  const maxLoginAttempts = 5;

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

  const registerUser = async (
    email: string,
    displayName: string,
  ): Promise<void> => {
    usedEmails.push(email);
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password: testPassword, displayName })
      .expect(statusCodeCreated);
  };

  describe('POST /auth/register', () => {
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

    it('rolls back the whole transaction when a later insert inside it fails', async () => {
      const email = randomEmail();
      const displayName = randomDisplayName();
      usedEmails.push(email);

      const originalInsert = EntityManager.prototype.insert;
      const insertSpy = jest
        .spyOn(EntityManager.prototype, 'insert')
        .mockImplementation(function (this: EntityManager, target, ...rest) {
          if (target === Group) {
            throw new Error('Simulated group insert failure');
          }
          return (originalInsert as (...args: unknown[]) => unknown).apply(this, [
            target,
            ...rest,
          ]) as ReturnType<EntityManager['insert']>;
        });

      try {
        await request(app.getHttpServer())
          .post('/auth/register')
          .send({ email, password: testPassword, displayName })
          .expect(500);
      } finally {
        insertSpy.mockRestore();
      }

      const user = await dataSource.manager.findOneBy(User, { email });
      expect(user).toBeNull();
    });
  });

  describe('POST /auth/login', () => {
    it('logs in with valid credentials and returns a session cookie', async () => {
      const email = randomEmail();
      await registerUser(email, randomDisplayName());

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email, password: testPassword })
        .expect(statusCodeCreated);

      expect(response.headers['set-cookie']).toBeDefined();
      expect(response.body).toMatchObject({ email });
    });

    it('throws Unauthorized for a wrong password', async () => {
      const email = randomEmail();
      await registerUser(email, randomDisplayName());

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email, password: wrotngPassword })
        .expect(statusCodeUnauthorized);
    });

    it('throws Unauthorized for an email that is not registered', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: randomEmail(), password: testPassword })
        .expect(statusCodeUnauthorized);
    });

    it('locks the account after too many failed attempts', async () => {
      const email = randomEmail();
      await registerUser(email, randomDisplayName());

      for (let attempt = 0; attempt < maxLoginAttempts; attempt++) {
        await request(app.getHttpServer())
          .post('/auth/login')
          .send({ email, password: wrotngPassword })
          .expect(statusCodeUnauthorized);
      }

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email, password: testPassword })
        .expect(statusCodeTooManyRequests);

      expect(response.body.retryAfterSeconds).toBeLessThan(0);
    });
  });

  describe('GET /auth/logout', () => {
    it('destroys the session and clears the cookie', async () => {
      const email = randomEmail();
      await registerUser(email, randomDisplayName());

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email, password: testPassword })
        .expect(statusCodeCreated);
      const sessionCookie = loginResponse.headers['set-cookie'];

      await request(app.getHttpServer())
        .get('/auth/logout')
        .set('Cookie', sessionCookie)
        .expect(statusCodeOk);

      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Cookie', sessionCookie)
        .expect(statusCodeUnauthorized);
    });

    it('throws Unauthorized when there is no session cookie', async () => {
      await request(app.getHttpServer())
        .get('/auth/logout')
        .expect(statusCodeUnauthorized);
    });
  });
});
