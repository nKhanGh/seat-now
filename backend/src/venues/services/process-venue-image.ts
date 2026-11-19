import { BadRequestException, PayloadTooLargeException, UnsupportedMediaTypeException } from '@nestjs/common';
import sharp from 'sharp';

export async function processVenueImage(
  file: { buffer: Buffer; size: number } | undefined,
  options: { label: string; width: number; height: number; fit: 'contain' | 'cover' },
) {
  if (!file || file.size < 1) throw new BadRequestException(`${options.label} is required`);
  if (file.size > 2_000_000) throw new PayloadTooLargeException(`${options.label} exceeds 2 MB`);
  try {
    const image = sharp(file.buffer, { failOn: 'error', limitInputPixels: 20_000_000 });
    const metadata = await image.metadata();
    if (!['jpeg', 'png', 'webp'].includes(metadata.format ?? '')) {
      throw new UnsupportedMediaTypeException('Only JPEG, PNG or WebP images are supported');
    }
    const processed = await image
      .rotate()
      .resize(options.width, options.height, {
        fit: options.fit,
        background: { r: 255, g: 255, b: 255, alpha: 0 },
      })
      .webp({ quality: 85 })
      .toBuffer();
    if (processed.length > 2_000_000)
      throw new PayloadTooLargeException(`${options.label} exceeds 2 MB after processing`);
    return processed;
  } catch (error) {
    if (error instanceof UnsupportedMediaTypeException || error instanceof PayloadTooLargeException)
      throw error;
    throw new UnsupportedMediaTypeException(`Invalid ${options.label.toLowerCase()} image`);
  }
}
