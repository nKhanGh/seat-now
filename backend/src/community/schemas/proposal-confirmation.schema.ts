import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ collection: 'proposal_confirmations', timestamps: true })
export class ProposalConfirmation {
  @Prop({ type: Types.ObjectId, required: true }) proposalId!: Types.ObjectId;
  @Prop({ type: Types.ObjectId, required: true }) userId!: Types.ObjectId;
  @Prop() createdAt!: Date;
}

export const ProposalConfirmationSchema = SchemaFactory.createForClass(ProposalConfirmation);
ProposalConfirmationSchema.index({ proposalId: 1, userId: 1 }, { unique: true });
