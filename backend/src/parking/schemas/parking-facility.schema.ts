import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';

const PointSchema = new MongooseSchema(
  {
    type: { type: String, enum: ['Point'], required: true },
    coordinates: { type: [Number], required: true },
  },
  { _id: false },
);

const PricingSchema = new MongooseSchema(
  {
    kind: { type: String, enum: ['FREE', 'FLAT', 'HOURLY', 'TIERED', 'UNKNOWN'], required: true },
    amountMinor: { type: Number, default: null },
    currency: { type: String, default: null },
    unit: { type: String, default: null },
    note: { type: String, default: null },
  },
  { _id: false },
);

@Schema({ collection: 'parking_facilities', timestamps: true })
export class ParkingFacility {
  @Prop({ required: true, unique: true }) slug!: string;
  @Prop({ required: true }) name!: string;
  @Prop({ required: true }) address!: string;
  @Prop({ required: true, type: PointSchema }) location!: { type: 'Point'; coordinates: [number, number] };
  @Prop({ required: true, enum: ['VENUE', 'PARTNER', 'PUBLIC'] }) kind!: string;
  @Prop({ type: [String], default: [] }) venueSlugs!: string[];
  @Prop({ type: [String], required: true }) vehicleTypes!: string[];
  @Prop({ default: false }) open24h!: boolean;
  @Prop({ type: String, default: null }) entranceNote!: string | null;
  @Prop({ required: true, type: PricingSchema }) pricing!: {
    kind: string;
    amountMinor: number | null;
    currency: string | null;
    unit: string | null;
    note: string | null;
  };
  @Prop({ default: 'ACTIVE' }) status!: string;
  @Prop({ type: Number, default: null }) availabilityVersion!: number | null;
  @Prop({ type: Number, default: null }) availableSpaces!: number | null;
  @Prop({ type: Number, default: null }) totalSpaces!: number | null;
  @Prop({ type: String, default: null }) availabilitySource!: string | null;
  @Prop({ type: Number, default: null }) availabilityConfidence!: number | null;
  @Prop({ type: Date, default: null }) availabilityCapturedAt!: Date | null;
  @Prop({ type: Date, default: null }) availabilityExpiresAt!: Date | null;
}

export const ParkingFacilitySchema = SchemaFactory.createForClass(ParkingFacility);
ParkingFacilitySchema.index({ location: '2dsphere' });
ParkingFacilitySchema.index({ venueSlugs: 1, status: 1 });
