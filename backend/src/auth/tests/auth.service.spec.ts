import { UnauthorizedException } from '@nestjs/common';
import { createHash } from 'node:crypto';
import * as argon2 from 'argon2';
import { Types } from 'mongoose';
import { AuthService } from '../services/auth.service';

describe('AuthService', () => {
  const userId = new Types.ObjectId();
  const user = {
    _id: userId,
    emailNormalized: 'test@example.com',
    displayName: 'Test User',
    status: 'ACTIVE' as const,
    emailVerifiedAt: null,
    passwordHash: '',
  };
  const users = { create: jest.fn(), findOne: jest.fn(), findById: jest.fn() };
  const sessions = { create: jest.fn(), findOne: jest.fn(), updateOne: jest.fn() };
  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(users as never, sessions as never);
  });

  it('hashes the password and stores only a session verifier hash', async () => {
    users.create.mockImplementation(async (input: typeof user) => ({ ...user, ...input }));
    sessions.create.mockResolvedValue({});
    const result = await service.register({
      email: ' TEST@example.com ',
      password: 'long-secret-password',
      displayName: 'Test User',
    });
    expect(users.create).toHaveBeenCalledWith(
      expect.objectContaining({ emailNormalized: 'test@example.com', passwordHash: expect.any(String) }),
    );
    expect(await argon2.verify(users.create.mock.calls[0][0].passwordHash, 'long-secret-password')).toBe(
      true,
    );
    expect(sessions.create.mock.calls[0][0].verifierHash).not.toBe(result.token.split('.')[1]);
    expect(result.user).not.toHaveProperty('passwordHash');
  });

  it('rejects an expired session even before TTL cleanup', async () => {
    const verifier = 'a'.repeat(64);
    sessions.findOne.mockResolvedValue({
      selector: 'b'.repeat(32),
      userId,
      verifierHash: createHash('sha256').update(verifier).digest('hex'),
      expiresAt: new Date(Date.now() - 1000),
    });
    await expect(service.authenticate(`${'b'.repeat(32)}.${verifier}`)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(users.findById).not.toHaveBeenCalled();
  });

  it('does not let a selector alone revoke a session', async () => {
    sessions.findOne.mockResolvedValue({
      selector: 'b'.repeat(32),
      userId,
      verifierHash: createHash('sha256').update('a'.repeat(64)).digest('hex'),
      expiresAt: new Date(Date.now() + 100000),
    });
    await service.logout(`${'b'.repeat(32)}.${'c'.repeat(64)}`);
    expect(sessions.updateOne).not.toHaveBeenCalled();
  });
});
