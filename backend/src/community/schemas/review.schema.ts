import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ collection: 'venue_reviews', timestamps: true })
export class Review {
  @Prop({ type: Types.ObjectId, required: true }) userId!: Types.ObjectId;
  @Prop({ required: true }) venueSlug!: string;
  @Prop({ required: true, min: 1, max: 5 }) rating!: number;
  @Prop({ default: '', maxlength: 500 }) body!: string;
  @Prop({ default: 'PUBLISHED', enum: ['PUBLISHED', 'HIDDEN'] }) status!: 'PUBLISHED' | 'HIDDEN';
  @Prop() createdAt!: Date;
  @Prop() updatedAt!: Date;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);
ReviewSchema.index({ userId: 1, venueSlug: 1 }, { unique: true });
ReviewSchema.index({ venueSlug: 1, status: 1, createdAt: -1, _id: -1 });
ReviewSchema.index({ userId: 1, status: 1, createdAt: -1, _id: -1 });
