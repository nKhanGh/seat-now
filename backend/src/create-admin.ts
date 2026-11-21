import 'reflect-metadata';
import { ConfigModule } from '@nestjs/config';
import * as argon2 from 'argon2';
import mongoose from 'mongoose';
import { User, UserSchema } from './auth/schemas/user.schema';

async function createAdmin() {
  await ConfigModule.forRoot({ envFilePath: ['.env.admin', '.env'] });
  const uri = process.env.MONGODB_URI;
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!uri || !email || !password)
    throw new Error('MONGODB_URI, ADMIN_EMAIL and ADMIN_PASSWORD are required');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 20)
    throw new Error('Use a valid admin email and a password of at least 20 characters');

  await mongoose.connect(uri);
  try {
    const users = mongoose.model(User.name, UserSchema);
    await users.createIndexes();
    if (await users.exists({ emailNormalized: email }))
      throw new Error('Account already exists; admin creation does not promote or reset existing accounts');
    await users.create({
      emailNormalized: email,
      displayName: 'SeatNow Admin',
      passwordHash: await argon2.hash(password, { type: argon2.argon2id }),
      role: 'ADMIN',
      status: 'ACTIVE',
    });
    console.log(`Created admin account: ${email}`);
  } finally {
    await mongoose.disconnect();
  }
}

void createAdmin().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
