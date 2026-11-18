import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ collection: 'parking_snapshots', timestamps: { createdAt: 'receivedAt', updatedAt: false } })
export class ParkingSnapshot {
  @Prop({ required: true }) facilitySlug!: string;
  @Prop({ required: true }) version!: number;
  @Prop({ type: Number, default: null }) availableSpaces!: number | null;
  @Prop({ type: Number, default: null }) totalSpaces!: number | null;
  @Prop({ required: true }) source!: string;
  @Prop({ required: true }) sourceRecordId!: string;
  @Prop({ required: true }) confidence!: number;
  @Prop({ required: true }) capturedAt!: Date;
  @Prop({ required: true }) expiresAt!: Date;
}

export const ParkingSnapshotSchema = SchemaFactory.createForClass(ParkingSnapshot);
ParkingSnapshotSchema.index({ facilitySlug: 1, version: 1 }, { unique: true });
ParkingSnapshotSchema.index({ source: 1, sourceRecordId: 1 }, { unique: true });
