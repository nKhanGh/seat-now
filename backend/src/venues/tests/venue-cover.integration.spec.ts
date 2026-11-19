import mongoose from 'mongoose';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { VenueCover, VenueCoverSchema } from '../schemas/venue-cover.schema';
import { VenueCoverService } from '../services/venue-cover.service';
import { VenuesService } from '../services/venues.service';

const testUri = process.env.MONGODB_TEST_URI;
const describeWithMongo = testUri ? describe : describe.skip;

describeWithMongo('venue cover with MongoDB', () => {
  const dbName = `seatnow_test_${randomUUID().replaceAll('-', '')}`;
  beforeAll(async () => { await mongoose.connect(testUri!, { dbName }); });
  afterAll(async () => { await mongoose.connection.dropDatabase(); await mongoose.disconnect(); });

  it('stores sanitized cover image with a stable public URL', async () => {
    const model = mongoose.model(VenueCover.name, VenueCoverSchema);
    await model.createIndexes();
    const venues = { activeLocation: jest.fn().mockResolvedValue([106.7, 10.77]),
      setHasCover: jest.fn().mockResolvedValue(undefined) } as unknown as VenuesService;
    const service = new VenueCoverService(model, venues);
    const image = await sharp({ create: { width: 16, height: 8, channels: 3, background: '#00ff00' } }).jpeg().toBuffer();
    expect((await service.upload('demo-cafe', { buffer: image, size: image.length })).data.coverUrl).toContain('/cover');
    const cover = await service.get('demo-cafe');
    expect(await sharp(cover).metadata()).toMatchObject({ format: 'webp', width: 1600, height: 800 });
    await expect(service.upload('demo-cafe', { buffer: Buffer.from('<svg/>'), size: 6 })).rejects.toThrow('Invalid cover image');
  });
});
