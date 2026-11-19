import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ collection: 'business_access', timestamps: true })
export class BusinessAccess {
  @Prop({ type: Types.ObjectId, required: true }) userId!: Types.ObjectId;
  @Prop({ required: true, unique: true }) venueSlug!: string;
  @Prop({ required: true, enum: ['FREE', 'PREMIUM'], default: 'FREE' }) plan!: 'FREE' | 'PREMIUM';
  @Prop({ type: Date, default: null }) premiumExpiresAt!: Date | null;
  @Prop({ default: false }) bookingEnabled!: boolean;
  @Prop() createdAt!: Date;
  @Prop() updatedAt!: Date;
}

export const BusinessAccessSchema = SchemaFactory.createForClass(BusinessAccess);
BusinessAccessSchema.index({ userId: 1, venueSlug: 1 });
