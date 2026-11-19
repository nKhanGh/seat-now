import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type VenueDocument = HydratedDocument<Venue>;

const PointSchema = new MongooseSchema(
  {
    type: { type: String, enum: ['Point'], required: true },
    coordinates: { type: [Number], required: true },
  },
  { _id: false },
);

@Schema({ collection: 'venues', timestamps: true })
export class Venue {
  @Prop({ required: true, unique: true }) slug!: string;
  @Prop({ required: true }) name!: string;
  @Prop({ required: true }) category!: string;
  @Prop({ type: [String], default: [] }) cuisineTypes!: string[];
  @Prop({ type: String, default: '' }) description!: string;
  @Prop({ type: String, default: '' }) openingHours!: string;
  @Prop({ type: String, default: '' }) menuSummary!: string;
  @Prop({ required: true, type: PointSchema }) location!: { type: 'Point'; coordinates: [number, number] };
  @Prop({ required: true }) address!: string;
  @Prop({ required: true }) priceTier!: number;
  @Prop({ required: true }) rating!: number;
  @Prop({ default: 'ACTIVE' }) status!: string;
  @Prop({ type: Boolean, default: false }) hasLogo!: boolean;
  @Prop({ type: Boolean, default: false }) hasCover!: boolean;
  @Prop({ type: Date, default: null }) businessPremiumExpiresAt!: Date | null;
  @Prop({ type: String, default: null }) promotionText!: string | null;
  @Prop({ type: Date, default: null }) promotionStartsAt!: Date | null;
  @Prop({ type: Date, default: null }) promotionEndsAt!: Date | null;
  @Prop({ type: Boolean, default: false }) sponsored!: boolean;
}

export const VenueSchema = SchemaFactory.createForClass(Venue);
VenueSchema.index({ location: '2dsphere' });
