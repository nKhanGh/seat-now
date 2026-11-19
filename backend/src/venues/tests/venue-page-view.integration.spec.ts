import mongoose from 'mongoose';
import { randomUUID } from 'node:crypto';
import { VenuePageView, VenuePageViewSchema } from '../schemas/venue-page-view.schema';
import { VenuePageViewService } from '../services/venue-page-view.service';

const testUri = process.env.MONGODB_TEST_URI;
const describeWithMongo = testUri ? describe : describe.skip;

describeWithMongo('venue page view aggregation with MongoDB', () => {
  const dbName = `seatnow_test_${randomUUID().replaceAll('-', '')}`;
  beforeAll(async () => { await mongoose.connect(testUri!, { dbName }); });
  afterAll(async () => { await mongoose.connection.dropDatabase(); await mongoose.disconnect(); });

  it('counts detail requests without retaining visitor identity', async () => {
    const model = mongoose.model(VenuePageView.name, VenuePageViewSchema);
    await model.createIndexes();
    const service = new VenuePageViewService(model);
    await service.record('demo-cafe');
    await service.record('demo-cafe');
    await service.record('other-cafe');
    const summary = await service.sevenDaySummary('demo-cafe');
    expect(summary.total).toBe(2);
    expect(summary.byHour[new Date().getUTCHours()].count).toBe(2);
    expect((await model.findOne({ slug: 'demo-cafe' }).lean())).not.toHaveProperty('userId');
  });
});
