import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'DECLINED' | 'CANCELED';

@Schema({ collection: 'booking_requests', timestamps: true })
export class Booking {
  @Prop({ type: Types.ObjectId, required: true }) userId!: Types.ObjectId;
  @Prop({ required: true }) venueSlug!: string;
  @Prop({ type: Date, required: true }) requestedAt!: Date;
  @Prop({ required: true, min: 1, max: 12 }) guestCount!: number;
  @Prop({ default: '' }) note!: string;
  @Prop({ required: true, default: false }) priority!: boolean;
  @Prop({ required: true, enum: ['PENDING', 'CONFIRMED', 'DECLINED', 'CANCELED'], default: 'PENDING' })
  status!: BookingStatus;
  @Prop({ type: Date, default: null }) resolvedAt!: Date | null;
  @Prop() createdAt!: Date;
  @Prop() updatedAt!: Date;
}

export const BookingSchema = SchemaFactory.createForClass(Booking);
BookingSchema.index({ userId: 1, venueSlug: 1, requestedAt: 1 }, { unique: true });
BookingSchema.index({ venueSlug: 1, status: -1, priority: -1, requestedAt: 1 });
BookingSchema.index({ userId: 1, createdAt: -1 });
