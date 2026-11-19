import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ collection: 'venue_logos', timestamps: true })
export class VenueLogo {
  @Prop({ required: true, unique: true }) slug!: string;
  @Prop({ required: true }) data!: Buffer;
  @Prop({ required: true, enum: ['image/webp'] }) contentType!: 'image/webp';
}

export const VenueLogoSchema = SchemaFactory.createForClass(VenueLogo);
