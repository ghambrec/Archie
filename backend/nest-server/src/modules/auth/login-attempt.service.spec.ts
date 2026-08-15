import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { LoginAttemptService } from './login-attempt.service';
import { REDIS_CLIENT } from '../redis/redis.module';
import test from 'node:test';

const failKey = (email: string) => `login:fail:${email}`;
const lockKey = (email: string) => `login:lock:${email}`;

describe('LoginAttemptService', () => {
  let service: LoginAttemptService;
  let redis: {
    ttl: jest.Mock;
    incr: jest.Mock;
    expire: jest.Mock;
    del: jest.Mock;
    multi: jest.Mock;
  };
  let multi: { set: jest.Mock; del: jest.Mock; exec: jest.Mock };

  const maxAttempts = 5;
  const lockoutSeconds = 900;
  const testMail = 'test@example.com';

  beforeEach(async () => {
    multi = {
      set: jest.fn().mockReturnThis(),
      del: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([]),
    };
    redis = {
      ttl: jest.fn(),
      incr: jest.fn(),
      expire: jest.fn(),
      del: jest.fn(),
      multi: jest.fn().mockReturnValue(multi),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoginAttemptService,
        { provide: REDIS_CLIENT, useValue: redis },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn((key: string) => {
              if (key === 'auth.maxLoginAttempts') return maxAttempts;
              if (key === 'auth.loginLockoutSeconds') return lockoutSeconds;
              throw new Error(`Unexpected config key: ${key}`);
            }),
          },
        },
      ],
    }).compile();

    service = module.get(LoginAttemptService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('isLocked', () => {
    it('returns the ttl when the account is locked', async () => {
      redis.ttl.mockResolvedValue(30);

      const result = await service.isLocked(testMail);

      expect(redis.ttl).toHaveBeenCalledWith(lockKey(testMail));
      expect(result).toBe(30);
    });

    it('returns null when there is no lock', async () => {
      redis.ttl.mockResolvedValue(-2);

      const result = await service.isLocked(testMail);

      expect(result).toBeNull();
    });

    it('returns null when the ttl is zero', async () => {
      redis.ttl.mockResolvedValue(0);

      const result = await service.isLocked(testMail);

      expect(result).toBeNull();
    });
  });

  describe('registerFailure', () => {
    it('sets an expiry on the first failed attempt', async () => {
      redis.incr.mockResolvedValue(1);

      await service.registerFailure(testMail);

      expect(redis.incr).toHaveBeenCalledWith(failKey(testMail));
      expect(redis.expire).toHaveBeenCalledWith(
        failKey(testMail),
        lockoutSeconds,
      );
      expect(redis.multi).not.toHaveBeenCalled();
    });

    it('does not reset the expiry on subsequent attempts below the threshold', async () => {
      redis.incr.mockResolvedValue(2);

      await service.registerFailure(testMail);

      expect(redis.expire).not.toHaveBeenCalled();
      expect(redis.multi).not.toHaveBeenCalled();
    });

    it('locks the account once the max attempts are reached', async () => {
      redis.incr.mockResolvedValue(maxAttempts);

      await service.registerFailure(testMail);

      expect(multi.set).toHaveBeenCalledWith(
        lockKey(testMail),
        '1',
        'EX',
        lockoutSeconds,
      );
      expect(multi.del).toHaveBeenCalledWith(failKey(testMail));
      expect(multi.exec).toHaveBeenCalled();
    });

    it('locks the account when attempts exceed the max', async () => {
      redis.incr.mockResolvedValue(maxAttempts + 1);

      await service.registerFailure(testMail);

      expect(redis.multi).toHaveBeenCalled();
    });
  });

  describe('clearAttempts', () => {
    it('deletes both the failure and lock keys', async () => {
      await service.clearAttempts(testMail);

      expect(redis.del).toHaveBeenCalledWith(
        failKey(testMail),
        lockKey(testMail),
      );
    });
  });
});
