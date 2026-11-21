import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import jwt, { JwtPayload } from 'jsonwebtoken';
import * as argon2 from 'argon2';
import { Model, Types } from 'mongoose';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { Session } from '../schemas/session.schema';
import { User, UserDocument } from '../schemas/user.schema';

const SESSION_DAYS = 7;
const developmentSecret = randomBytes(32).toString('hex');
const DUMMY_HASH_PROMISE = argon2.hash('invalid-placeholder-password', {
  type: argon2.argon2id,
});

export type PublicUser = {
  id: string;
  email: string;
  displayName: string;
  role: 'USER' | 'ADMIN';
  emailVerified: boolean;
};

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly users: Model<User>,
    @InjectModel(Session.name) private readonly sessions: Model<Session>,
  ) {}

  async register(input: RegisterDto): Promise<{ user: PublicUser; token: string }> {
    const emailNormalized = input.email.trim().toLowerCase();
    try {
      const user = await this.users.create({
        emailNormalized,
        passwordHash: await argon2.hash(input.password, { type: argon2.argon2id }),
        displayName: input.displayName.trim(),
        role: 'USER',
      });
      const token = await this.createSession(user._id);
      return { user: this.toPublicUser(user), token };
    } catch (error: unknown) {
      if (this.isDuplicateKey(error)) {
        throw new ConflictException({ code: 'AUTH_EMAIL_EXISTS', message: 'Email already registered' });
      }
      throw error;
    }
  }

  async login(input: LoginDto): Promise<{ user: PublicUser; token: string }> {
    const user = await this.users.findOne({ emailNormalized: input.email.trim().toLowerCase() });
    // Run password verification even for an unknown email to reduce timing differences.
    const valid = await argon2.verify(user?.passwordHash ?? (await DUMMY_HASH_PROMISE), input.password);
    if (!user || !valid || user.status !== 'ACTIVE') {
      throw new UnauthorizedException({ code: 'AUTH_INVALID_CREDENTIALS', message: 'Invalid credentials' });
    }
    const token = await this.createSession(user._id);
    return { user: this.toPublicUser(user), token };
  }

  async authenticate(token: string | undefined): Promise<PublicUser> {
    const claims = this.verifyToken(token);
    const session = await this.sessions.findOne({ selector: claims.sid, revokedAt: null });
    const suppliedHash = createHash('sha256').update(token!).digest();
    if (
      !session ||
      session.expiresAt.getTime() <= Date.now() ||
      session.userId.toString() !== claims.sub ||
      !timingSafeEqual(suppliedHash, Buffer.from(session.verifierHash, 'hex'))
    ) {
      throw new UnauthorizedException({ code: 'AUTH_REQUIRED', message: 'Authentication required' });
    }
    const user = await this.users.findById(session.userId);
    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException({ code: 'AUTH_REQUIRED', message: 'Authentication required' });
    }
    return this.toPublicUser(user);
  }

  async logout(token: string | undefined): Promise<void> {
    try {
      await this.authenticate(token);
    } catch {
      return;
    }
    const { sid } = this.verifyToken(token);
    await this.sessions.updateOne({ selector: sid, revokedAt: null }, { $set: { revokedAt: new Date() } });
  }

  async publicUsersByIds(ids: Types.ObjectId[]) {
    const users = await this.users.find({ _id: { $in: ids }, status: 'ACTIVE' }, { displayName: 1 }).lean();
    return users.map((user) => ({ id: user._id.toString(), displayName: user.displayName }));
  }

  async adminUsersByIds(ids: Types.ObjectId[]) {
    const users = await this.users.find({ _id: { $in: ids } }, { emailNormalized: 1, displayName: 1 }).lean();
    return users.map((user) => ({
      id: user._id.toString(),
      email: user.emailNormalized,
      displayName: user.displayName,
    }));
  }

  async publicProfileById(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('User not found');
    const user = await this.users
      .findOne({ _id: new Types.ObjectId(id), status: 'ACTIVE' }, { displayName: 1 })
      .lean();
    if (!user) throw new NotFoundException('User not found');
    return { id: user._id.toString(), displayName: user.displayName };
  }

  private async createSession(userId: Types.ObjectId): Promise<string> {
    const selector = randomBytes(16).toString('hex');
    const token = jwt.sign({ sid: selector }, this.signingSecret(), {
      algorithm: 'HS256',
      subject: userId.toString(),
      issuer: 'seatnow',
      audience: 'seatnow-web',
      expiresIn: SESSION_DAYS * 24 * 60 * 60,
    });
    await this.sessions.create({
      selector,
      userId,
      verifierHash: createHash('sha256').update(token).digest('hex'),
      expiresAt: new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000),
    });
    return token;
  }

  private signingSecret() {
    return process.env.JWT_SECRET || developmentSecret;
  }

  private verifyToken(token: string | undefined): JwtPayload & { sub: string; sid: string } {
    try {
      if (!token) throw new Error('Missing token');
      const claims = jwt.verify(token, this.signingSecret(), {
        algorithms: ['HS256'],
        issuer: 'seatnow',
        audience: 'seatnow-web',
      });
      if (
        typeof claims === 'string' ||
        typeof claims.sub !== 'string' ||
        !Types.ObjectId.isValid(claims.sub) ||
        typeof claims.sid !== 'string' ||
        !/^[a-f0-9]{32}$/.test(claims.sid)
      )
        throw new Error('Invalid claims');
      return claims as JwtPayload & { sub: string; sid: string };
    } catch {
      throw new UnauthorizedException({ code: 'AUTH_REQUIRED', message: 'Authentication required' });
    }
  }

  private toPublicUser(user: UserDocument): PublicUser {
    return {
      id: user._id.toString(),
      email: user.emailNormalized,
      displayName: user.displayName,
      role: user.role === 'ADMIN' ? 'ADMIN' : 'USER',
      emailVerified: Boolean(user.emailVerifiedAt),
    };
  }

  private isDuplicateKey(error: unknown): boolean {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;
  }
}
