import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { VenuesService } from '../../venues/services/venues.service';
import { Favorite } from '../schemas/favorite.schema';

@Injectable()
export class FavoritesService {
  constructor(
    @InjectModel(Favorite.name) private readonly favorites: Model<Favorite>,
    private readonly venues: VenuesService,
  ) {}

  async list(userId: string) {
    const rows = await this.favorites.find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1, _id: -1 }).limit(100).lean();
    const profiles = await this.venues.publicProfilesBySlugs(rows.map((row) => row.venueSlug));
    const bySlug = new Map(profiles.map((profile) => [profile.slug, profile]));
    return { data: rows.flatMap((row) => {
      const profile = bySlug.get(row.venueSlug);
      return profile ? [{ ...profile, savedAt: row.createdAt }] : [];
    }) };
  }

  async save(userId: string, slug: string) {
    await this.venues.activeLocation(slug);
    await this.favorites.updateOne(
      { userId: new Types.ObjectId(userId), venueSlug: slug },
      { $setOnInsert: { createdAt: new Date() } }, { upsert: true },
    );
    return { data: { saved: true } };
  }

  async remove(userId: string, slug: string) {
    await this.favorites.deleteOne({ userId: new Types.ObjectId(userId), venueSlug: slug });
    return { data: { saved: false } };
  }
}
