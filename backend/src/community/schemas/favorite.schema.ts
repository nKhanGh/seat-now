import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ collection: 'user_favorites', timestamps: true })
export class Favorite {
  @Prop({ type: Types.ObjectId, required: true }) userId!: Types.ObjectId;
  @Prop({ required: true }) venueSlug!: string;
  @Prop() createdAt!: Date;
}

export const FavoriteSchema = SchemaFactory.createForClass(Favorite);
FavoriteSchema.index({ userId: 1, venueSlug: 1 }, { unique: true });
FavoriteSchema.index({ userId: 1, createdAt: -1 });
