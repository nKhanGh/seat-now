import { BadRequestException, Injectable, NotFoundException, PayloadTooLargeException, UnsupportedMediaTypeException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import sharp from 'sharp';
import { VenueLogo } from '../schemas/venue-logo.schema';
import { VenuesService } from './venues.service';

@Injectable()
export class VenueLogoService {
  constructor(@InjectModel(VenueLogo.name) private readonly logos: Model<VenueLogo>, private readonly venues: VenuesService) {}

  async upload(slug: string, file: { buffer: Buffer; size: number } | undefined) {
    await this.venues.activeLocation(slug);
    if (!file || file.size < 1) throw new BadRequestException('Logo is required');
    if (file.size > 2_000_000) throw new PayloadTooLargeException('Logo exceeds 2 MB');
    let processed: Buffer;
    try {
      const image = sharp(file.buffer, { failOn: 'error', limitInputPixels: 20_000_000 });
      const metadata = await image.metadata();
      if (!['jpeg', 'png', 'webp'].includes(metadata.format ?? '')) throw new UnsupportedMediaTypeException('Only JPEG, PNG or WebP logos are supported');
      processed = await image.rotate().resize(256, 256, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } }).webp({ quality: 85 }).toBuffer();
    } catch (error) {
      if (error instanceof UnsupportedMediaTypeException) throw error;
      throw new UnsupportedMediaTypeException('Invalid logo image');
    }
    await this.logos.updateOne({ slug }, { $set: { data: processed, contentType: 'image/webp' } }, { upsert: true });
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
