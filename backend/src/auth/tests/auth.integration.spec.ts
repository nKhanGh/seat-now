import mongoose from 'mongoose';
import { randomUUID } from 'node:crypto';
import { AuthService } from '../services/auth.service';
import { User, UserSchema } from '../schemas/user.schema';
import { Session, SessionSchema } from '../schemas/session.schema';

const testUri = process.env.MONGODB_TEST_URI;
const describeWithMongo = testUri ? describe : describe.skip;

describeWithMongo('AuthService with MongoDB', () => {
  const dbName = `seatnow_test_${randomUUID().replaceAll('-', '')}`;

  beforeAll(async () => {
    await mongoose.connect(testUri!, { dbName });
  });
  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });

  it('registers, signs in, rejects duplicate email and revokes a session', async () => {
    const users = mongoose.model(User.name, UserSchema);
    const sessions = mongoose.model(Session.name, SessionSchema);
    await Promise.all([users.createIndexes(), sessions.createIndexes()]);
    const auth = new AuthService(users, sessions);
    const input = {
      email: ' DEMO@example.invalid ',
      password: 'a-strong-demo-password',
      displayName: 'Demo User',
    };
    const registered = await auth.register(input);
    expect(registered.user).toMatchObject({ email: 'demo@example.invalid', emailVerified: false });
    expect(await users.findOne({ emailNormalized: 'demo@example.invalid' })).toHaveProperty('passwordHash');
    await expect(auth.register({ ...input, email: 'demo@example.invalid' })).rejects.toThrow(
      'Email already registered',
    );

    const loggedIn = await auth.login({ email: 'demo@example.invalid', password: input.password });
    expect(loggedIn.token).not.toBe(registered.token);
    expect((await auth.authenticate(loggedIn.token)).id).toBe(registered.user.id);
    await expect(auth.login({ email: input.email, password: 'wrong-password' })).rejects.toThrow(
      'Invalid credentials',
    );
    await auth.logout(loggedIn.token);
    await expect(auth.authenticate(loggedIn.token)).rejects.toThrow('Authentication required');
    expect((await auth.authenticate(registered.token)).id).toBe(registered.user.id);
  });
});
