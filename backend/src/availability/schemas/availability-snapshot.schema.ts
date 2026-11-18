import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type AvailabilitySnapshotDocument = HydratedDocument<AvailabilitySnapshot>;

export type Capacity = { total: number; available: number } | null;

const CapacitySchema = new MongooseSchema({
  total: { type: Number, required: true, min: 0 },
  available: { type: Number, required: true, min: 0 },
}, { _id: false });

@Schema({ collection: 'availability_snapshots', timestamps: { createdAt: 'receivedAt', updatedAt: false } })
export class AvailabilitySnapshot {
  @Prop({ required: true }) slug!: string;
  @Prop({ required: true, min: 1 }) version!: number;
  @Prop({ type: CapacitySchema, default: null }) tables!: Capacity;
  @Prop({ type: CapacitySchema, default: null }) seats!: Capacity;
  @Prop({ required: true, enum: ['QUIET', 'MODERATE', 'BUSY', 'FULL', 'UNKNOWN'] }) crowdLevel!: string;
  @Prop({ type: Number, default: null }) estimatedWaitMinutes!: number | null;
  @Prop({ required: true }) acceptingGuests!: boolean;
  @Prop({ required: true, enum: ['DEMO', 'OPERATOR', 'POS'] }) source!: string;
  @Prop({ required: true }) sourceRecordId!: string;
  @Prop({ required: true, min: 0, max: 1 }) confidence!: number;
  @Prop({ required: true }) capturedAt!: Date;
  @Prop({ required: true }) expiresAt!: Date;
  receivedAt!: Date;
}

export const AvailabilitySnapshotSchema = SchemaFactory.createForClass(AvailabilitySnapshot);
AvailabilitySnapshotSchema.index({ slug: 1, version: 1 }, { unique: true });
AvailabilitySnapshotSchema.index({ source: 1, sourceRecordId: 1 }, { unique: true });

@Schema({ collection: 'availability_latest' })
export class AvailabilityLatest {
  @Prop({ required: true, unique: true }) slug!: string;
  @Prop({ required: true }) version!: number;
  @Prop({ type: CapacitySchema, default: null }) tables!: Capacity;
  @Prop({ type: CapacitySchema, default: null }) seats!: Capacity;
  @Prop({ required: true }) crowdLevel!: string;
  @Prop({ type: Number, default: null }) estimatedWaitMinutes!: number | null;
  @Prop({ required: true }) acceptingGuests!: boolean;
  @Prop({ required: true }) source!: string;
  @Prop({ required: true }) confidence!: number;
  @Prop({ required: true }) capturedAt!: Date;
  @Prop({ required: true }) expiresAt!: Date;
}

export const AvailabilityLatestSchema = SchemaFactory.createForClass(AvailabilityLatest);
