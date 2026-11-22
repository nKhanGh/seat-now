import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ collection: 'parking_reservations', timestamps: true })
export class ParkingReservation {
  @Prop({ type: Types.ObjectId, required: true }) userId!: Types.ObjectId;
  @Prop({ required: true }) venueSlug!: string;
  @Prop({ required: true }) facilitySlug!: string;
  @Prop({ required: true, enum: ['CAR', 'MOTORBIKE'] }) vehicleType!: 'CAR' | 'MOTORBIKE';
  @Prop({ required: true }) startsAt!: Date;
  @Prop({ required: true }) endsAt!: Date;
  @Prop({ required: true, enum: ['PENDING', 'CONFIRMED', 'DECLINED', 'CANCELED', 'COMPLETED'] }) status!:
    'PENDING' | 'CONFIRMED' | 'DECLINED' | 'CANCELED' | 'COMPLETED';
  @Prop({ type: Date, default: null }) resolvedAt!: Date | null;
  @Prop() createdAt!: Date;
}

export const ParkingReservationSchema = SchemaFactory.createForClass(ParkingReservation);
ParkingReservationSchema.index({ userId: 1, facilitySlug: 1, startsAt: 1 }, { unique: true });
ParkingReservationSchema.index({ venueSlug: 1, status: 1, startsAt: 1 });
