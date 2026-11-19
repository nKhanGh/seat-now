import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ collection: 'review_reports', timestamps: true })
export class ReviewReport {
  @Prop({ type: Types.ObjectId, required: true }) reviewId!: Types.ObjectId;
  @Prop({ type: Types.ObjectId, required: true }) reporterId!: Types.ObjectId;
  @Prop({ required: true, enum: ['SPAM', 'ABUSE', 'OTHER'] }) reason!: 'SPAM' | 'ABUSE' | 'OTHER';
  @Prop() createdAt!: Date;
}

export const ReviewReportSchema = SchemaFactory.createForClass(ReviewReport);
ReviewReportSchema.index({ reviewId: 1, reporterId: 1 }, { unique: true });
ReviewReportSchema.index({ createdAt: -1 });
