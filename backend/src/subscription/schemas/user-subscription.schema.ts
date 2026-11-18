import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema, Types } from 'mongoose';

@Schema({ collection: 'user_subscriptions', timestamps: true })
export class UserSubscription {
  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, unique: true }) userId!: Types.ObjectId;
  @Prop({ required: true, enum: ['PREMIUM'] }) plan!: 'PREMIUM';
  @Prop({ required: true, enum: ['ACTIVE', 'PAST_DUE', 'CANCELED', 'EXPIRED'] }) status!: 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'EXPIRED';
  @Prop({ required: true }) currentPeriodStart!: Date;
  @Prop({ required: true }) currentPeriodEnd!: Date;
  @Prop({ default: false }) cancelAtPeriodEnd!: boolean;
}

export const UserSubscriptionSchema = SchemaFactory.createForClass(UserSubscription);
