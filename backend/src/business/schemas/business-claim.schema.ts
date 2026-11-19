import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ collection: 'business_claims', timestamps: true })
export class BusinessClaim {
  @Prop({ type: Types.ObjectId, required: true }) userId!: Types.ObjectId;
  @Prop({ required: true }) venueSlug!: string;
  @Prop({ required: true, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' })
  status!: 'PENDING' | 'APPROVED' | 'REJECTED';
  @Prop({ required: true, trim: true, maxlength: 300 }) evidence!: string;
  @Prop() createdAt!: Date;
  @Prop() updatedAt!: Date;
}

export const BusinessClaimSchema = SchemaFactory.createForClass(BusinessClaim);
BusinessClaimSchema.index({ userId: 1, venueSlug: 1 }, { unique: true });
BusinessClaimSchema.index({ status: 1, createdAt: 1 });
