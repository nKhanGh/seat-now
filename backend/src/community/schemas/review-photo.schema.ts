import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ collection: 'review_photos', timestamps: true })
export class ReviewPhoto {
  @Prop({ type: Types.ObjectId, required: true, unique: true }) reviewId!: Types.ObjectId;
  @Prop({ type: Buffer, required: true }) data!: Buffer;
  @Prop({ required: true, enum: ['image/webp'] }) contentType!: 'image/webp';
  @Prop() createdAt!: Date;
}

export const ReviewPhotoSchema = SchemaFactory.createForClass(ReviewPhoto);
