import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { VenueCover } from '../schemas/venue-cover.schema';
import { processVenueImage } from './process-venue-image';
import { VenuesService } from './venues.service';

@Injectable()
export class VenueCoverService {
  constructor(
    @InjectModel(VenueCover.name) private readonly covers: Model<VenueCover>,
    private readonly venues: VenuesService,
  ) {}

  async upload(slug: string, file: { buffer: Buffer; size: number } | undefined) {
    await this.venues.activeLocation(slug);
    const data = await processVenueImage(file, { label: 'Cover', width: 1600, height: 800, fit: 'cover' });
    await this.covers.updateOne({ slug }, { $set: { data, contentType: 'image/webp' } }, { upsert: true });
    await this.venues.setHasCover(slug);
    return { data: { coverUrl: `/api/v1/venues/${encodeURIComponent(slug)}/cover` } };
  }

  async get(slug: string) {
    await this.venues.activeLocation(slug);
    const cover = await this.covers.findOne({ slug });
    if (!cover) throw new NotFoundException('Cover not found');
    return cover.data;
  }
}
