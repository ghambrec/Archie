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
import { DocumentGroup } from '../src/modules/document-groups/entities/document-group.entity';
import { Permission } from '../src/modules/permissions/entities/permission.entity';
import { UserPermission } from '../src/modules/user_permission/entities/user_permission.entity';
import { PermissionsService } from '../src/modules/permissions/permissions.service';
import { DocumentPermission } from '../src/modules/permissions/permission-keys';
import { IngestionService } from '../src/modules/ai-service/ingestion/ingestion.service';
import { ErrorCode } from '../src/common/errors/error-code';

const ALL_DOCUMENT_PERMISSIONS = Object.values(DocumentPermission);

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
  const statusCodeForbidden = 403;
  const statusCodeNotFound = 404;
  const statusCodeConflict = 409;

  const aiIngestionServiceMock = {
    triggerIngestion: jest.fn().mockResolvedValue(undefined),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(IngestionService)
      .useValue(aiIngestionServiceMock)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new ApplicationExceptionFilter());
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    dataSource = moduleFixture.get(DataSource);

    // ai_documents is owned by the ai-service (backend/ai-service/src/ai_tables.sql),
    // which does not run in the e2e environment. The documents queries join it.
    await dataSource.query(`
      CREATE TABLE IF NOT EXISTS ai_documents (
        id UUID PRIMARY KEY REFERENCES documents(id) ON DELETE CASCADE,
        status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'FINISHED', 'FAILED', 'SKIPPED')),
        ai_summary TEXT,
        language VARCHAR(10),
        error_key TEXT,
        error_detail TEXT,
        retry_count SMALLINT NOT NULL DEFAULT 0,
        processed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
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

    await request(app.getHttpServer())
      .patch('/users/me/password')
      .set('Cookie', response.headers['set-cookie'])
      .send({ password: testPassword })
      .expect(statusCodeOk);

    const user = await dataSource.manager.findOneByOrFail(User, { email });

    return { sessionCookie: response.headers['set-cookie'], userId: user.id };
  };

  const grantPermissions = async (
    userId: string,
    groupId: string,
    permKeys: string[],
  ): Promise<void> => {
    for (const permKey of permKeys) {
      const permission = await dataSource.manager.findOneByOrFail(Permission, { permKey });
      await dataSource.manager.insert(UserPermission, {
        userId,
        groupId,
        permissionId: permission.id,
      });
    }
    // Permissions are cached in Redis, drop the cache so the guards see the new grants
    await app.get(PermissionsService).invalidateUserPermissions(userId);
  };

  const addUserToGroup = async (
    userId: string,
    groupId: string,
    permKeys: string[],
  ): Promise<void> => {
    await dataSource.manager.insert(UserGroup, { userId, groupId });
    await grantPermissions(userId, groupId, permKeys);
  };

  const createGroupForUser = async (
    userId: string,
    permKeys: string[] = ALL_DOCUMENT_PERMISSIONS,
  ): Promise<Group> => {
    const groupInsert = await dataSource.manager.insert(Group, {
      name: `e2e-group-${randomUUID()}`,
      isSystem: false,
    });
    const groupId = groupInsert.identifiers[0].id as string;
    createdGroupIds.push(groupId);

    await addUserToGroup(userId, groupId, permKeys);

    return dataSource.manager.findOneByOrFail(Group, { id: groupId });
  };

  const uploadDocumentToGroup = async (
    sessionCookie: string,
    groupId: string,
    content = 'hello world',
  ): Promise<string> => {
    const response = await request(app.getHttpServer())
      .post(`/documents/upload/${groupId}`)
      .set('Cookie', sessionCookie)
      .attach('file', Buffer.from(content), 'hello.txt')
      .expect(statusCodeCreated);

    return response.body.id;
  };

  const uploadDocument = async ({
    sessionCookie,
    userId,
  }: {
    sessionCookie: string;
    userId: string;
  }): Promise<string> => {
    const group = await createGroupForUser(userId);

    const response = await request(app.getHttpServer())
      .post(`/documents/upload/${group.id}`)
      .set('Cookie', sessionCookie)
      .attach('file', Buffer.from('hello world'), 'hello.txt')
      .expect(statusCodeCreated);

    return response.body.id;
  };

  describe('POST /documents/upload/:groupId', () => {
    it('stores the document, assigns it to the group and triggers AI ingestion', async () => {
      const { sessionCookie, userId } = await registerUser();
      const group = await createGroupForUser(userId);

      const response = await request(app.getHttpServer())
        .post(`/documents/upload/${group.id}`)
        .set('Cookie', sessionCookie)
        .attach('file', Buffer.from('hello world'), 'hello.txt')
        .expect(statusCodeCreated);

      expect(response.body.id).toBeDefined();
      expect(aiIngestionServiceMock.triggerIngestion).toHaveBeenCalledTimes(1);
      expect(aiIngestionServiceMock.triggerIngestion).toHaveBeenCalledWith(response.body.id);

      const documentResponse = await request(app.getHttpServer())
        .get(`/documents/${response.body.id}`)
        .set('Cookie', sessionCookie)
        .expect(statusCodeOk);

      expect(documentResponse.body.groups).toEqual([{ id: group.id, name: group.name }]);
    });

    it('rejects a duplicate file in the same group but accepts it in another group', async () => {
      const { sessionCookie, userId } = await registerUser();
      const group = await createGroupForUser(userId);
      const otherGroup = await createGroupForUser(userId);

      await request(app.getHttpServer())
        .post(`/documents/upload/${group.id}`)
        .set('Cookie', sessionCookie)
        .attach('file', Buffer.from('hello world'), 'hello.txt')
        .expect(statusCodeCreated);

      const duplicateResponse = await request(app.getHttpServer())
        .post(`/documents/upload/${group.id}`)
        .set('Cookie', sessionCookie)
        .attach('file', Buffer.from('hello world'), 'renamed.txt')
        .expect(statusCodeConflict);

      expect(duplicateResponse.body.code).toBe(ErrorCode.DocumentAlreadyExistsInGroup);

      await request(app.getHttpServer())
        .post(`/documents/upload/${otherGroup.id}`)
        .set('Cookie', sessionCookie)
        .attach('file', Buffer.from('hello world'), 'hello.txt')
        .expect(statusCodeCreated);

      expect(aiIngestionServiceMock.triggerIngestion).toHaveBeenCalledTimes(2);
    });

    it('accepts the same file again after the previous one was deleted', async () => {
      const { sessionCookie, userId } = await registerUser();
      const group = await createGroupForUser(userId);

      const firstResponse = await request(app.getHttpServer())
        .post(`/documents/upload/${group.id}`)
        .set('Cookie', sessionCookie)
        .attach('file', Buffer.from('hello world'), 'hello.txt')
        .expect(statusCodeCreated);

      await request(app.getHttpServer())
        .delete(`/documents/${firstResponse.body.id}`)
        .set('Cookie', sessionCookie)
        .expect(statusCodeNoContent);

      await request(app.getHttpServer())
        .post(`/documents/upload/${group.id}`)
        .set('Cookie', sessionCookie)
        .attach('file', Buffer.from('hello world'), 'hello.txt')
        .expect(statusCodeCreated);
    });

    it('rejects the request when no file is attached', async () => {
      const { sessionCookie, userId } = await registerUser();
      const group = await createGroupForUser(userId);

      await request(app.getHttpServer())
        .post(`/documents/upload/${group.id}`)
        .set('Cookie', sessionCookie)
        .expect(statusCodeBadRequest);

      expect(aiIngestionServiceMock.triggerIngestion).not.toHaveBeenCalled();
    });

    it('rejects the request when the group id is not a valid UUID', async () => {
      const { sessionCookie } = await registerUser();

      await request(app.getHttpServer())
        .post('/documents/upload/not-a-uuid')
        .set('Cookie', sessionCookie)
        .attach('file', Buffer.from('hello world'), 'hello.txt')
        .expect(statusCodeBadRequest);

      expect(aiIngestionServiceMock.triggerIngestion).not.toHaveBeenCalled();
    });

    it('returns forbidden for a group the user does not belong to', async () => {
      const owner = await registerUser();
      const otherUser = await registerUser();
      const otherGroup = await createGroupForUser(otherUser.userId);

      await request(app.getHttpServer())
        .post(`/documents/upload/${otherGroup.id}`)
        .set('Cookie', owner.sessionCookie)
        .attach('file', Buffer.from('hello world'), 'hello.txt')
        .expect(statusCodeForbidden);

      expect(aiIngestionServiceMock.triggerIngestion).not.toHaveBeenCalled();

      const listResponse = await request(app.getHttpServer())
        .get('/documents')
        .set('Cookie', owner.sessionCookie)
        .expect(statusCodeOk);

      expect(listResponse.body.total).toBe(0);
    });

    it('returns forbidden when the user lacks documents.upload in the group', async () => {
      const { sessionCookie, userId } = await registerUser();
      const group = await createGroupForUser(userId, [
        DocumentPermission.Read,
        DocumentPermission.Update,
        DocumentPermission.Delete,
      ]);

      await request(app.getHttpServer())
        .post(`/documents/upload/${group.id}`)
        .set('Cookie', sessionCookie)
        .attach('file', Buffer.from('hello world'), 'hello.txt')
        .expect(statusCodeForbidden);

      expect(aiIngestionServiceMock.triggerIngestion).not.toHaveBeenCalled();
    });

    it('rejects the request when there is no session cookie', async () => {
      await request(app.getHttpServer())
        .post(`/documents/upload/${randomUUID()}`)
        .attach('file', Buffer.from('hello world'), 'hello.txt')
        .expect(statusCodeUnauthorized);

      expect(aiIngestionServiceMock.triggerIngestion).not.toHaveBeenCalled();
    });
  });

  describe('GET /documents', () => {
    it('lists only documents from groups the user can read', async () => {
      const owner = await registerUser();
      const otherUser = await registerUser();

      const documentId = await uploadDocument(owner);
      await uploadDocument(otherUser);

      const response = await request(app.getHttpServer())
        .get('/documents')
        .set('Cookie', owner.sessionCookie)
        .expect(statusCodeOk);

      expect(response.body.total).toBe(1);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].id).toBe(documentId);
    });

    it('lists documents uploaded by other users in a group where the user has documents.read', async () => {
      const owner = await registerUser();
      const reader = await registerUser();
      const group = await createGroupForUser(owner.userId);
      const documentId = await uploadDocumentToGroup(owner.sessionCookie, group.id);

      await addUserToGroup(reader.userId, group.id, [DocumentPermission.Read]);

      const response = await request(app.getHttpServer())
        .get('/documents')
        .set('Cookie', reader.sessionCookie)
        .expect(statusCodeOk);

      expect(response.body.total).toBe(1);
      expect(response.body.data[0]).toMatchObject({
        id: documentId,
        uploadedBy: { id: owner.userId },
      });
    });

    it('does not list documents of a group where the user is a member without documents.read', async () => {
      const owner = await registerUser();
      const member = await registerUser();
      const group = await createGroupForUser(owner.userId);
      await uploadDocumentToGroup(owner.sessionCookie, group.id);

      await addUserToGroup(member.userId, group.id, [DocumentPermission.Update]);

      const response = await request(app.getHttpServer())
        .get('/documents')
        .set('Cookie', member.sessionCookie)
        .expect(statusCodeOk);

      expect(response.body.total).toBe(0);
    });

    it('counts a document once when it is in several readable groups', async () => {
      const owner = await registerUser();
      const firstGroup = await createGroupForUser(owner.userId);
      const secondGroup = await createGroupForUser(owner.userId);
      const documentId = await uploadDocumentToGroup(owner.sessionCookie, firstGroup.id);

      await dataSource.manager.insert(DocumentGroup, {
        documentId,
        groupId: secondGroup.id,
      });

      const response = await request(app.getHttpServer())
        .get('/documents')
        .set('Cookie', owner.sessionCookie)
        .expect(statusCodeOk);

      expect(response.body.total).toBe(1);
      expect(response.body.data).toHaveLength(1);
    });
  });

  describe('GET /documents/:id', () => {
    it('returns the document summary for its owner', async () => {
      const user = await registerUser();
      const { sessionCookie } = user;
      const documentId = await uploadDocument(user);

      const response = await request(app.getHttpServer())
        .get(`/documents/${documentId}`)
        .set('Cookie', sessionCookie)
        .expect(statusCodeOk);

      expect(response.body).toMatchObject({ id: documentId, filename: 'hello.txt' });
    });

    it('returns forbidden for a document in a group the user cannot read', async () => {
      const owner = await registerUser();
      const otherUser = await registerUser();
      const documentId = await uploadDocument(owner);

      await request(app.getHttpServer())
        .get(`/documents/${documentId}`)
        .set('Cookie', otherUser.sessionCookie)
        .expect(statusCodeForbidden);
    });

    it('returns a document uploaded by another user in a group where the user has documents.read', async () => {
      const owner = await registerUser();
      const reader = await registerUser();
      const group = await createGroupForUser(owner.userId);
      const documentId = await uploadDocumentToGroup(owner.sessionCookie, group.id);

      await addUserToGroup(reader.userId, group.id, [DocumentPermission.Read]);

      const response = await request(app.getHttpServer())
        .get(`/documents/${documentId}`)
        .set('Cookie', reader.sessionCookie)
        .expect(statusCodeOk);

      expect(response.body).toMatchObject({ id: documentId, uploadedBy: { id: owner.userId } });
    });

    it('returns not found for a document that does not exist', async () => {
      const { sessionCookie } = await registerUser();

      const response = await request(app.getHttpServer())
        .get(`/documents/${randomUUID()}`)
        .set('Cookie', sessionCookie)
        .expect(statusCodeNotFound);

      expect(response.body.code).toBe(ErrorCode.DocumentNotFound);
    });

    it('rejects the request when the document id is not a valid UUID', async () => {
      const { sessionCookie } = await registerUser();

      await request(app.getHttpServer())
        .get('/documents/not-a-uuid')
        .set('Cookie', sessionCookie)
        .expect(statusCodeBadRequest);
    });
  });

  describe('GET /documents/:id/download', () => {
    it('streams the original file content back', async () => {
      const user = await registerUser();
      const { sessionCookie } = user;
      const documentId = await uploadDocument(user);

      const response = await request(app.getHttpServer())
        .get(`/documents/${documentId}/download`)
        .set('Cookie', sessionCookie)
        .expect(statusCodeOk);

      expect(response.text).toBe('hello world');
      expect(response.headers['content-disposition']).toContain('hello.txt');
    });

    it('returns forbidden for a document in a group the user cannot read', async () => {
      const owner = await registerUser();
      const otherUser = await registerUser();
      const documentId = await uploadDocument(owner);

      await request(app.getHttpServer())
        .get(`/documents/${documentId}/download`)
        .set('Cookie', otherUser.sessionCookie)
        .expect(statusCodeForbidden);
    });
  });

  describe('POST /documents/:id/tags and DELETE /documents/:id/tags/:tagId', () => {
    it('assigns and removes a tag from a document', async () => {
      const user = await registerUser();
      const { sessionCookie } = user;
      const documentId = await uploadDocument(user);
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

    it('returns forbidden when the user only has documents.read in the group', async () => {
      const owner = await registerUser();
      const reader = await registerUser();
      const group = await createGroupForUser(owner.userId);
      const documentId = await uploadDocumentToGroup(owner.sessionCookie, group.id);
      const tag = await dataSource.manager.findOneByOrFail(Tag, { name: 'contract' });

      await addUserToGroup(reader.userId, group.id, [DocumentPermission.Read]);

      await request(app.getHttpServer())
        .post(`/documents/${documentId}/tags`)
        .set('Cookie', reader.sessionCookie)
        .send({ tagId: tag.id })
        .expect(statusCodeForbidden);

      await request(app.getHttpServer())
        .delete(`/documents/${documentId}/tags/${tag.id}`)
        .set('Cookie', reader.sessionCookie)
        .expect(statusCodeForbidden);
    });

    it('allows another user with documents.update in the group to assign a tag', async () => {
      const owner = await registerUser();
      const editor = await registerUser();
      const group = await createGroupForUser(owner.userId);
      const documentId = await uploadDocumentToGroup(owner.sessionCookie, group.id);
      const tag = await dataSource.manager.findOneByOrFail(Tag, { name: 'contract' });

      await addUserToGroup(editor.userId, group.id, [DocumentPermission.Update]);

      await request(app.getHttpServer())
        .post(`/documents/${documentId}/tags`)
        .set('Cookie', editor.sessionCookie)
        .send({ tagId: tag.id })
        .expect(statusCodeCreated);
    });
  });

  describe('DELETE /documents/:id', () => {
    it('soft-deletes the document so it can no longer be fetched', async () => {
      const user = await registerUser();
      const { sessionCookie } = user;
      const documentId = await uploadDocument(user);

      await request(app.getHttpServer())
        .delete(`/documents/${documentId}`)
        .set('Cookie', sessionCookie)
        .expect(statusCodeNoContent);

      await request(app.getHttpServer())
        .get(`/documents/${documentId}`)
        .set('Cookie', sessionCookie)
        .expect(statusCodeNotFound);
    });

    it('returns forbidden when the user has documents.update but not documents.delete', async () => {
      const owner = await registerUser();
      const editor = await registerUser();
      const group = await createGroupForUser(owner.userId);
      const documentId = await uploadDocumentToGroup(owner.sessionCookie, group.id);

      await addUserToGroup(editor.userId, group.id, [
        DocumentPermission.Read,
        DocumentPermission.Update,
      ]);

      await request(app.getHttpServer())
        .delete(`/documents/${documentId}`)
        .set('Cookie', editor.sessionCookie)
        .expect(statusCodeForbidden);

      await request(app.getHttpServer())
        .get(`/documents/${documentId}`)
        .set('Cookie', owner.sessionCookie)
        .expect(statusCodeOk);
    });

    it('allows another user with documents.delete in the group to delete the document', async () => {
      const owner = await registerUser();
      const deleter = await registerUser();
      const group = await createGroupForUser(owner.userId);
      const documentId = await uploadDocumentToGroup(owner.sessionCookie, group.id);

      await addUserToGroup(deleter.userId, group.id, [DocumentPermission.Delete]);

      await request(app.getHttpServer())
        .delete(`/documents/${documentId}`)
        .set('Cookie', deleter.sessionCookie)
        .expect(statusCodeNoContent);
    });
  });
});
