import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ collection: 'venue_check_ins' })
export class CheckIn {
  @Prop({ type: Types.ObjectId, required: true }) userId!: Types.ObjectId;
  @Prop({ required: true }) venueSlug!: string;
  @Prop({ required: true }) checkedAt!: Date;
  @Prop({ required: true }) windowStart!: Date;
}

export const CheckInSchema = SchemaFactory.createForClass(CheckIn);
CheckInSchema.index({ userId: 1, venueSlug: 1, windowStart: 1 }, { unique: true });
CheckInSchema.index({ venueSlug: 1, checkedAt: -1 });
CheckInSchema.index({ checkedAt: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });
