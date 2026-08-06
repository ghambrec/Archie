import { Test, TestingModule } from '@nestjs/testing';
import { StorageService } from './storage.service';
import { MINIO_CLIENT } from './minio/minio.module';

describe('StorageService', () => {
  let service: StorageService;
  let client: {
    putObject: jest.Mock;
    removeObject: jest.Mock;
    statObject: jest.Mock;
    presignedUrl: jest.Mock;
  };

  beforeEach(async () => {
    client = {
      putObject: jest.fn(),
      removeObject: jest.fn(),
      statObject: jest.fn(),
      presignedUrl: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [StorageService, { provide: MINIO_CLIENT, useValue: client }],
    }).compile();

    service = module.get<StorageService>(StorageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('putObject delegates to the MinIO client', async () => {
    client.putObject.mockResolvedValue({ etag: 'etag-1', versionId: null });
    const buffer = Buffer.from('test');

    const result = await service.putObject(
      'documents',
      'doc-1/file.pdf',
      buffer,
      4,
      {
        'Content-Type': 'application/pdf',
      },
    );

    expect(client.putObject).toHaveBeenCalledWith(
      'documents',
      'doc-1/file.pdf',
      buffer,
      4,
      { 'Content-Type': 'application/pdf' },
    );
    expect(result).toEqual({ etag: 'etag-1', versionId: null });
  });

  it('removeObject delegates to the MinIO client', async () => {
    await service.removeObject('documents', 'doc-1/file.pdf');

    expect(client.removeObject).toHaveBeenCalledWith(
      'documents',
      'doc-1/file.pdf',
    );
  });

  it('objectExists returns true when statObject succeeds', async () => {
    client.statObject.mockResolvedValue({ size: 4 });

    await expect(
      service.objectExists('documents', 'doc-1/file.pdf'),
    ).resolves.toBe(true);
  });

  it('objectExists returns false when statObject throws', async () => {
    client.statObject.mockRejectedValue(new Error('not found'));

    await expect(
      service.objectExists('documents', 'doc-1/file.pdf'),
    ).resolves.toBe(false);
  });

  it('getPresignedDownloadUrl delegates to the MinIO client with a default expiry', async () => {
    client.presignedUrl.mockResolvedValue('https://minio.local/signed');

    const url = await service.getPresignedDownloadUrl(
      'documents',
      'doc-1/file.pdf',
    );

    expect(client.presignedUrl).toHaveBeenCalledWith(
      'GET',
      'documents',
      'doc-1/file.pdf',
      300,
    );
    expect(url).toBe('https://minio.local/signed');
  });
});
