import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AvailabilityService } from '../../availability/services/availability.service';
import { Venue } from '../../map/schemas/venue.schema';

@Injectable()
export class VenuesService {
  constructor(@InjectModel(Venue.name) private readonly venues: Model<Venue>, private readonly availability: AvailabilityService) {}

  async activeLocation(slug: string): Promise<[number, number]> {
    const venue = await this.venues.findOne({ slug, status: 'ACTIVE' }, { location: 1 }).lean();
    if (!venue) throw new NotFoundException('Venue not found');
    return venue.location.coordinates;
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
