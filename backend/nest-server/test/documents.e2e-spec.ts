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
import { UserGroup } from '../src/modules/user-groups/entities/user-group.entity';
import { Document } from '../src/modules/documents/entities/document.entity';
import { Tag } from '../src/modules/tags/entities/tag.entity';
import { AiIngestionService } from '../src/modules/ai-service/ai-ingestion.service';
import { ErrorCode } from '../src/common/errors/error-code';

const randomEmail = () => `e2e-${randomUUID()}@example.com`;
const randomDisplayName = () => `e2e-${randomUUID()}`;

describe('DocumentsController (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let usedEmails: string[];
  let createdGroupIds: string[];

  const testPassword = 'password1234';
  const statusCodeOk = 200;
  const statusCodeCreated = 201;
  const statusCodeNoContent = 204;
  const statusCodeBadRequest = 400;
  const statusCodeUnauthorized = 401;
  const statusCodeNotFound = 404;
  const statusCodeConflict = 409;

  const aiIngestionServiceMock = {
    triggerIngestion: jest.fn().mockResolvedValue(undefined),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(AiIngestionService)
      .useValue(aiIngestionServiceMock)
      .compile();

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
    createdGroupIds = [];
    aiIngestionServiceMock.triggerIngestion.mockClear();
  });

  afterEach(async () => {
    for (const email of usedEmails) {
      const user = await dataSource.manager.findOneBy(User, { email });
      if (user) {
        await dataSource.manager.delete(Document, { uploadedBy: user.id });
        await dataSource.manager.delete(User, { id: user.id });
        await dataSource.manager.delete(Group, { name: `personal-${user.id}` });
      }
    }
    for (const groupId of createdGroupIds) {
      await dataSource.manager.delete(Group, { id: groupId });
    }
  });

  const registerUser = async (): Promise<{ sessionCookie: string; userId: string }> => {
    const email = randomEmail();
    usedEmails.push(email);

    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password: testPassword, displayName: randomDisplayName() })
      .expect(statusCodeCreated);

    const user = await dataSource.manager.findOneByOrFail(User, { email });

    return { sessionCookie: response.headers['set-cookie'], userId: user.id };
  };

  const createGroupForUser = async (userId: string): Promise<Group> => {
    const groupInsert = await dataSource.manager.insert(Group, {
      name: `e2e-group-${randomUUID()}`,
      isSystem: false,
    });
    const groupId = groupInsert.identifiers[0].id as string;
    createdGroupIds.push(groupId);

    await dataSource.manager.insert(UserGroup, { userId, groupId });

    return dataSource.manager.findOneByOrFail(Group, { id: groupId });
  };

  const uploadDocument = async (sessionCookie: string): Promise<string> => {
    const response = await request(app.getHttpServer())
      .post('/documents/upload')
      .set('Cookie', sessionCookie)
      .attach('file', Buffer.from('hello world'), 'hello.txt')
      .expect(statusCodeCreated);

    return response.body.id;
  };

  describe('POST /documents/upload', () => {
    it('stores the document and triggers AI ingestion without calling the real AI service', async () => {
      const { sessionCookie } = await registerUser();

      const response = await request(app.getHttpServer())
        .post('/documents/upload')
        .set('Cookie', sessionCookie)
        .attach('file', Buffer.from('hello world'), 'hello.txt')
        .expect(statusCodeCreated);

      expect(response.body.id).toBeDefined();
      expect(aiIngestionServiceMock.triggerIngestion).toHaveBeenCalledTimes(1);
      expect(aiIngestionServiceMock.triggerIngestion).toHaveBeenCalledWith(response.body.id);
    });

    it('rejects the request when no file is attached', async () => {
      const { sessionCookie } = await registerUser();

      await request(app.getHttpServer())
        .post('/documents/upload')
        .set('Cookie', sessionCookie)
        .expect(statusCodeBadRequest);

      expect(aiIngestionServiceMock.triggerIngestion).not.toHaveBeenCalled();
    });

    it('rejects the request when there is no session cookie', async () => {
      await request(app.getHttpServer())
        .post('/documents/upload')
        .attach('file', Buffer.from('hello world'), 'hello.txt')
        .expect(statusCodeUnauthorized);

      expect(aiIngestionServiceMock.triggerIngestion).not.toHaveBeenCalled();
    });
  });

  describe('GET /documents', () => {
    it('lists only documents uploaded by the current user', async () => {
      const owner = await registerUser();
      const otherUser = await registerUser();

      const documentId = await uploadDocument(owner.sessionCookie);
      await uploadDocument(otherUser.sessionCookie);

      const response = await request(app.getHttpServer())
        .get('/documents')
        .set('Cookie', owner.sessionCookie)
        .expect(statusCodeOk);

      expect(response.body.total).toBe(1);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].id).toBe(documentId);
    });
  });

  describe('GET /documents/:id', () => {
    it('returns the document summary for its owner', async () => {
      const { sessionCookie } = await registerUser();
      const documentId = await uploadDocument(sessionCookie);

      const response = await request(app.getHttpServer())
        .get(`/documents/${documentId}`)
        .set('Cookie', sessionCookie)
        .expect(statusCodeOk);

      expect(response.body).toMatchObject({ id: documentId, filename: 'hello.txt' });
    });

    it('returns not found for a document owned by another user', async () => {
      const owner = await registerUser();
      const otherUser = await registerUser();
      const documentId = await uploadDocument(owner.sessionCookie);

      const response = await request(app.getHttpServer())
        .get(`/documents/${documentId}`)
        .set('Cookie', otherUser.sessionCookie)
        .expect(statusCodeNotFound);

      expect(response.body.code).toBe(ErrorCode.DocumentNotFound);
    });
  });

  describe('GET /documents/:id/download', () => {
    it('streams the original file content back', async () => {
      const { sessionCookie } = await registerUser();
      const documentId = await uploadDocument(sessionCookie);

      const response = await request(app.getHttpServer())
        .get(`/documents/${documentId}/download`)
        .set('Cookie', sessionCookie)
        .expect(statusCodeOk);

      expect(response.text).toBe('hello world');
      expect(response.headers['content-disposition']).toContain('hello.txt');
    });
  });

  describe('POST /documents/:id/tags and DELETE /documents/:id/tags/:tagId', () => {
    it('assigns and removes a tag from a document', async () => {
      const { sessionCookie } = await registerUser();
      const documentId = await uploadDocument(sessionCookie);
      const tag = await dataSource.manager.findOneByOrFail(Tag, { name: 'contract' });

      const assignResponse = await request(app.getHttpServer())
        .post(`/documents/${documentId}/tags`)
        .set('Cookie', sessionCookie)
        .send({ tagId: tag.id })
        .expect(statusCodeCreated);

      expect(assignResponse.body).toMatchObject({ documentId, tagId: tag.id });

      await request(app.getHttpServer())
        .post(`/documents/${documentId}/tags`)
        .set('Cookie', sessionCookie)
        .send({ tagId: tag.id })
        .expect(statusCodeConflict);

      await request(app.getHttpServer())
        .delete(`/documents/${documentId}/tags/${tag.id}`)
        .set('Cookie', sessionCookie)
        .expect(statusCodeNoContent);

      await request(app.getHttpServer())
        .delete(`/documents/${documentId}/tags/${tag.id}`)
        .set('Cookie', sessionCookie)
        .expect(statusCodeNotFound);
    });
  });

  describe('POST /documents/:id/group', () => {
    it('assigns the document to a group the user belongs to', async () => {
      const { sessionCookie, userId } = await registerUser();
      const documentId = await uploadDocument(sessionCookie);
      const group = await createGroupForUser(userId);

      const response = await request(app.getHttpServer())
        .post(`/documents/${documentId}/group`)
        .set('Cookie', sessionCookie)
        .send({ groupId: group.id })
        .expect(statusCodeCreated);

      expect(response.body).toMatchObject({ documentId, groupId: group.id });
    });

    it('returns not found for a group the user does not belong to', async () => {
      const owner = await registerUser();
      const otherUser = await registerUser();
      const documentId = await uploadDocument(owner.sessionCookie);
      const otherGroup = await createGroupForUser(otherUser.userId);

      await request(app.getHttpServer())
        .post(`/documents/${documentId}/group`)
        .set('Cookie', owner.sessionCookie)
        .send({ groupId: otherGroup.id })
        .expect(statusCodeNotFound);
    });
  });

  describe('DELETE /documents/:id', () => {
    it('soft-deletes the document so it can no longer be fetched', async () => {
      const { sessionCookie } = await registerUser();
      const documentId = await uploadDocument(sessionCookie);

      await request(app.getHttpServer())
        .delete(`/documents/${documentId}`)
        .set('Cookie', sessionCookie)
        .expect(statusCodeNoContent);

      await request(app.getHttpServer())
        .get(`/documents/${documentId}`)
        .set('Cookie', sessionCookie)
        .expect(statusCodeNotFound);
    });
  });
});
