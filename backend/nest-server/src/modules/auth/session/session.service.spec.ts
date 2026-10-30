import type Redis from 'ioredis';
import { SessionService } from './session.service';

describe('SessionService.destroyAllForUser', () => {
  it('deletes all indexed sessions and their user index', async () => {
    const del = jest.fn().mockReturnThis();
    const exec = jest.fn().mockResolvedValue([[null, 2]]);
    const redis = { del, smembers: jest.fn().mockResolvedValue(['first', 'second']), multi: () => ({ del, exec }) };
    await new SessionService(redis as unknown as Redis).destroyAllForUser('user');
    expect(redis.smembers).toHaveBeenCalledWith('user:user:sessions');
    expect(del.mock.calls).toEqual([[['session:first', 'session:second']], ['user:user:sessions']]);
  });

  it('propagates Redis command errors so restoration cannot activate an account with old sessions', async () => {
    const error = new Error('Session deletion failed');
    const del = jest.fn().mockReturnThis();
    const redis = {
      smembers: jest.fn().mockResolvedValue(['first']),
      multi: () => ({ del, exec: jest.fn().mockResolvedValue([[error, null], [null, 1]]) }),
    };
    await expect(new SessionService(redis as unknown as Redis).destroyAllForUser('user')).rejects.toThrow(error);
    expect(del.mock.calls).toEqual([[['session:first']]]);
  });

  it('rejects an aborted Redis transaction', async () => {
    const del = jest.fn().mockReturnThis();
    const redis = {
      smembers: jest.fn().mockResolvedValue(['first']),
      multi: () => ({ del, exec: jest.fn().mockResolvedValue(null) }),
    };
    await expect(new SessionService(redis as unknown as Redis).destroyAllForUser('user')).rejects.toThrow();
  });
});
