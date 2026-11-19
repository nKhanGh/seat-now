import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ collection: 'user_follows', timestamps: true })
export class Follow {
  @Prop({ type: Types.ObjectId, required: true }) followerId!: Types.ObjectId;
  @Prop({ type: Types.ObjectId, required: true }) followingId!: Types.ObjectId;
  @Prop() createdAt!: Date;
}

export const FollowSchema = SchemaFactory.createForClass(Follow);
FollowSchema.index({ followerId: 1, followingId: 1 }, { unique: true });
FollowSchema.index({ followingId: 1, createdAt: -1 });
