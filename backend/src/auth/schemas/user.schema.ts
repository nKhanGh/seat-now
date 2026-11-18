import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ collection: 'users', timestamps: true })
export class User {
  @Prop({ required: true, trim: true, unique: true })
  emailNormalized!: string;

  @Prop({ required: true })
  passwordHash!: string;

  @Prop({ required: true, trim: true })
  displayName!: string;

  @Prop({ required: true, enum: ['ACTIVE', 'DISABLED'], default: 'ACTIVE' })
  status!: 'ACTIVE' | 'DISABLED';

  @Prop({ type: Date, default: null })
  emailVerifiedAt!: Date | null;
}

export const UserSchema = SchemaFactory.createForClass(User);
