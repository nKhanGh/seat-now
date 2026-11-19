import mongoose, { Types } from 'mongoose';
import { randomUUID } from 'node:crypto';
import { CheckIn, CheckInSchema } from '../schemas/check-in.schema';
import { CheckInService } from '../services/check-in.service';
import { VenuesService } from '../../venues/services/venues.service';

const testUri = process.env.MONGODB_TEST_URI;
const describeWithMongo = testUri ? describe : describe.skip;

describeWithMongo('community check-in with MongoDB', () => {
  const dbName = `seatnow_test_${randomUUID().replaceAll('-', '')}`;

  beforeAll(async () => {
    await mongoose.connect(testUri!, { dbName });
  });
  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });

  it('accepts a nearby user once per window and exposes only an aggregate count', async () => {
    const model = mongoose.model(CheckIn.name, CheckInSchema);
    await model.createIndexes();
    const venues = {
      activeLocation: jest.fn().mockResolvedValue([106.7009, 10.7769]),
    } as unknown as VenuesService;
    const service = new CheckInService(model, venues);
    const userId = new Types.ObjectId().toString();
    const position = { lat: 10.7769, lng: 106.7009, accuracyM: 20 };

    await expect(service.checkIn(userId, 'demo-cafe', { ...position, lat: 10.8 })).rejects.toThrow(
      'Move closer',
    );
    await expect(service.checkIn(userId, 'demo-cafe', { ...position, accuracyM: 101 })).rejects.toThrow(
      'Location accuracy',
    );
    const first = await service.checkIn(userId, 'demo-cafe', position);
    const second = await service.checkIn(userId, 'demo-cafe', position);
    expect(first.data.duplicate).toBe(false);
    expect(second.data.duplicate).toBe(true);
    expect((await service.summary('demo-cafe')).lastHourUsers).toBe(1);
    expect(await model.countDocuments({ venueSlug: 'demo-cafe' })).toBe(1);
    expect(await model.findOne({ venueSlug: 'demo-cafe' }).lean()).not.toHaveProperty('location');
  });
});
