import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ collection: 'venue_covers', timestamps: true })
export class VenueCover {
  @Prop({ required: true, unique: true }) slug!: string;
  @Prop({ required: true }) data!: Buffer;
  @Prop({ required: true, enum: ['image/webp'] }) contentType!: 'image/webp';
}

export const VenueCoverSchema = SchemaFactory.createForClass(VenueCover);
