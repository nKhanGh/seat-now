import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { VenueLogo } from '../schemas/venue-logo.schema';
import { VenuesService } from './venues.service';
import { processVenueImage } from './process-venue-image';

@Injectable()
export class VenueLogoService {
  constructor(
    @InjectModel(VenueLogo.name) private readonly logos: Model<VenueLogo>,
    private readonly venues: VenuesService,
  ) {}

  async upload(slug: string, file: { buffer: Buffer; size: number } | undefined) {
    await this.venues.activeLocation(slug);
    const processed = await processVenueImage(file, {
      label: 'Logo',
      width: 256,
      height: 256,
      fit: 'contain',
    });
    await this.logos.updateOne(
      { slug },
      { $set: { data: processed, contentType: 'image/webp' } },
      { upsert: true },
    );
    await this.venues.setHasLogo(slug);
    return { data: { logoUrl: `/api/v1/venues/${encodeURIComponent(slug)}/logo` } };
  }

  async get(slug: string) {
    await this.venues.activeLocation(slug);
    const logo = await this.logos.findOne({ slug });
    if (!logo) throw new NotFoundException('Logo not found');
    return logo.data;
  }
}
