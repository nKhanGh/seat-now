import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type VenueMapViewDocument = HydratedDocument<VenueMapView>;

const PointSchema = new MongooseSchema({
  type: { type: String, enum: ['Point'], required: true },
  coordinates: { type: [Number], required: true },
}, { _id: false });

@Schema({ collection: 'venue_map_views', timestamps: true })
export class VenueMapView {
  @Prop({ required: true, unique: true })
  slug!: string;

  @Prop({ required: true })
  name!: string;

  @Prop({ required: true, enum: ['RESTAURANT', 'CAFE', 'CINEMA'] })
  category!: 'RESTAURANT' | 'CAFE' | 'CINEMA';

  @Prop({ required: true, type: PointSchema })
  location!: { type: 'Point'; coordinates: [number, number] };

  @Prop({ required: true })
  address!: string;

  @Prop({ required: true, min: 1, max: 4 })
  priceTier!: number;

  @Prop({ required: true, min: 0, max: 5 })
  rating!: number;

  @Prop({ required: true, enum: ['QUIET', 'MODERATE', 'BUSY', 'FULL', 'UNKNOWN'], default: 'UNKNOWN' })
  crowdLevel!: string;

  @Prop({ type: Number, default: null })
  tablesAvailable!: number | null;

  @Prop({ type: Number, default: null }) tablesTotal!: number | null;
  @Prop({ type: Number, default: null }) seatsAvailable!: number | null;
  @Prop({ type: Number, default: null }) seatsTotal!: number | null;
  @Prop({ type: Number, default: null }) estimatedWaitMinutes!: number | null;
  @Prop({ type: Boolean, default: null }) acceptingGuests!: boolean | null;
  @Prop({ type: String, default: null }) availabilitySource!: string | null;
  @Prop({ type: Number, default: null }) availabilityConfidence!: number | null;
  @Prop({ type: Number, default: null }) availabilityVersion!: number | null;
  @Prop({ type: Date, default: null }) availabilityCapturedAt!: Date | null;

  @Prop({ type: Date, default: null })
  availabilityExpiresAt!: Date | null;
}

export const VenueMapViewSchema = SchemaFactory.createForClass(VenueMapView);
VenueMapViewSchema.index({ location: '2dsphere' });
