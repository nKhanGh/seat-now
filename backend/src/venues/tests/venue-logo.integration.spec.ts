import mongoose from 'mongoose';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { VenueLogo, VenueLogoSchema } from '../schemas/venue-logo.schema';
import { VenueLogoService } from '../services/venue-logo.service';
import { VenuesService } from '../services/venues.service';

const testUri = process.env.MONGODB_TEST_URI;
const describeWithMongo = testUri ? describe : describe.skip;

describeWithMongo('venue logo with MongoDB', () => {
  const dbName = `seatnow_test_${randomUUID().replaceAll('-', '')}`;
  beforeAll(async () => { await mongoose.connect(testUri!, { dbName }); });
  afterAll(async () => { await mongoose.connection.dropDatabase(); await mongoose.disconnect(); });

  it('sanitizes and replaces a logo while rejecting unsupported files', async () => {
    const model = mongoose.model(VenueLogo.name, VenueLogoSchema);
    await model.createIndexes();
    const venues = { activeLocation: jest.fn().mockResolvedValue([106.7, 10.77]),
      setHasLogo: jest.fn().mockResolvedValue(undefined) } as unknown as VenuesService;
    const service = new VenueLogoService(model, venues);
    const image = await sharp({ create: { width: 16, height: 16, channels: 3, background: '#ff0000' } }).png().toBuffer();
    await service.upload('demo-cafe', { buffer: image, size: image.length });
    const logo = await service.get('demo-cafe');
    expect((await sharp(logo).metadata()).format).toBe('webp');
    expect((await sharp(logo).metadata()).width).toBe(256);
    await service.upload('demo-cafe', { buffer: image, size: image.length });
    expect(await model.countDocuments({ slug: 'demo-cafe' })).toBe(1);
    await expect(service.upload('demo-cafe', { buffer: Buffer.from('<svg/>'), size: 6 })).rejects.toThrow('Invalid logo image');
  });
});
