import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ collection: 'venue_proposals', timestamps: true })
export class VenueProposal {
  @Prop({ type: Types.ObjectId, required: true }) createdBy!: Types.ObjectId;
  @Prop({ required: true, unique: true }) slug!: string;
  @Prop({ required: true }) name!: string;
  @Prop({ required: true, enum: ['RESTAURANT', 'CAFE', 'CINEMA'] }) category!:
    'RESTAURANT' | 'CAFE' | 'CINEMA';
  @Prop({ type: [String], default: [] }) cuisineTypes!: string[];
  @Prop({ required: true }) description!: string;
  @Prop({ required: true }) address!: string;
  @Prop({ required: true }) lat!: number;
  @Prop({ required: true }) lng!: number;
  @Prop({ required: true }) priceTier!: number;
  @Prop({ required: true, enum: ['PENDING', 'READY_FOR_REVIEW', 'APPROVED', 'REJECTED'], default: 'PENDING' })
  status!: string;
  @Prop({ default: 0 }) confirmationCount!: number;
  @Prop() createdAt!: Date;
  @Prop() updatedAt!: Date;
}

export const VenueProposalSchema = SchemaFactory.createForClass(VenueProposal);
VenueProposalSchema.index({ status: 1, createdAt: -1 });
VenueProposalSchema.index({ createdBy: 1, createdAt: -1 });
