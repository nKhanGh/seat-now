import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ collection: 'venue_page_views' })
export class VenuePageView {
  @Prop({ required: true }) slug!: string;
  @Prop({ required: true }) hourStart!: Date;
  @Prop({ required: true, default: 0 }) count!: number;
}

export const VenuePageViewSchema = SchemaFactory.createForClass(VenuePageView);
VenuePageViewSchema.index({ slug: 1, hourStart: 1 }, { unique: true });
VenuePageViewSchema.index({ hourStart: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });
