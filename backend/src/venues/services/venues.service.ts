import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AvailabilityService } from '../../availability/services/availability.service';
import { Venue } from '../../map/schemas/venue.schema';
import { VenueMapView } from '../../map/schemas/venue-map-view.schema';

@Injectable()
export class VenuesService {
  constructor(
    @InjectModel(Venue.name) private readonly venues: Model<Venue>,
    @InjectModel(VenueMapView.name) private readonly views: Model<VenueMapView>,
    private readonly availability: AvailabilityService,
  ) {}

  async publishProposal(profile: { slug: string; name: string; category: 'RESTAURANT' | 'CAFE' | 'CINEMA'; cuisineTypes: string[]; description: string; address: string; lat: number; lng: number; priceTier: number }) {
    const publicFields = {
      name: profile.name, category: profile.category, cuisineTypes: profile.cuisineTypes,
      address: profile.address, location: { type: 'Point' as const, coordinates: [profile.lng, profile.lat] as [number, number] },
      priceTier: profile.priceTier, rating: 0, status: 'ACTIVE',
    };
    await this.venues.updateOne({ slug: profile.slug }, { $setOnInsert: { ...publicFields, description: profile.description } }, { upsert: true });
    await this.views.updateOne({ slug: profile.slug }, { $setOnInsert: publicFields }, { upsert: true });
    return { slug: profile.slug };
  }

  async activeLocation(slug: string): Promise<[number, number]> {
    const venue = await this.venues.findOne({ slug, status: 'ACTIVE' }, { location: 1 }).lean();
    if (!venue) throw new NotFoundException('Venue not found');
    return venue.location.coordinates;
  }

  async publicProfilesBySlugs(slugs: string[]) {
    const venues = await this.venues.find({ slug: { $in: slugs }, status: 'ACTIVE' },
      { slug: 1, name: 1, category: 1, address: 1, location: 1, priceTier: 1, rating: 1 }).lean();
    return venues.map((venue) => ({
      slug: venue.slug, name: venue.name, category: venue.category, address: venue.address,
      location: venue.location, priceTier: venue.priceTier, rating: venue.rating,
    }));
  }

  async getBySlug(slug: string) {
    const venue = await this.venues.findOne({ slug, status: 'ACTIVE' }).lean();
    if (!venue) throw new NotFoundException('Venue not found');
    return { data: {
      id: venue._id.toString(), slug: venue.slug, name: venue.name,
      category: venue.category, cuisineTypes: venue.cuisineTypes ?? [],
      description: venue.description ?? '', address: venue.address,
      location: venue.location, priceTier: venue.priceTier, rating: venue.rating,
      availability: await this.availability.summaryForSlug(slug),
    } };
  }
}
