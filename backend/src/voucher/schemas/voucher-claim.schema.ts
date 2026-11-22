import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ collection: 'voucher_claims', timestamps: true })
export class VoucherClaim {
  @Prop({ type: Types.ObjectId, required: true }) userId!: Types.ObjectId;
  @Prop({ type: Types.ObjectId, required: true }) offerId!: Types.ObjectId;
  @Prop({ required: true }) code!: string;
  @Prop({ required: true, enum: ['CLAIMED', 'REDEEMED'] }) status!: 'CLAIMED' | 'REDEEMED';
  @Prop({ type: Date, default: null }) redeemedAt!: Date | null;
  @Prop() createdAt!: Date;
}

export const VoucherClaimSchema = SchemaFactory.createForClass(VoucherClaim);
VoucherClaimSchema.index({ userId: 1, offerId: 1 }, { unique: true });
VoucherClaimSchema.index({ code: 1 }, { unique: true });
