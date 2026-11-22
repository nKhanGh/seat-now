import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ collection: 'voucher_offers', timestamps: true })
export class VoucherOffer {
  @Prop({ required: true }) venueSlug!: string;
  @Prop({ required: true }) venueName!: string;
  @Prop({ required: true }) title!: string;
  @Prop({ required: true }) discountText!: string;
  @Prop({ required: true }) startsAt!: Date;
  @Prop({ required: true }) expiresAt!: Date;
  @Prop({ required: true, min: 0 }) remaining!: number;
  @Prop({ required: true, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' }) status!: 'ACTIVE' | 'INACTIVE';
}

export const VoucherOfferSchema = SchemaFactory.createForClass(VoucherOffer);
VoucherOfferSchema.index({ status: 1, expiresAt: 1 });
