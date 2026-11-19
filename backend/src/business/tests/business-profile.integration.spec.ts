import mongoose from 'mongoose';
import { randomUUID } from 'node:crypto';
import { AvailabilityService } from '../../availability/services/availability.service';
import { VenueMapView, VenueMapViewSchema } from '../../map/schemas/venue-map-view.schema';
import { Venue, VenueSchema } from '../../map/schemas/venue.schema';
import { VenuesService } from '../../venues/services/venues.service';

const testUri = process.env.MONGODB_TEST_URI;
const describeWithMongo = testUri ? describe : describe.skip;

describeWithMongo('business venue profile with MongoDB', () => {
  const dbName = `seatnow_test_${randomUUID().replaceAll('-', '')}`;
  beforeAll(async () => { await mongoose.connect(testUri!, { dbName }); });
  afterAll(async () => { await mongoose.connection.dropDatabase(); await mongoose.disconnect(); });

  it('updates public profile and map projection together', async () => {
    const venues = mongoose.model(Venue.name, VenueSchema);
    const views = mongoose.model(VenueMapView.name, VenueMapViewSchema);
    await Promise.all([venues.createIndexes(), views.createIndexes()]);
    const base = { slug: 'demo-cafe', name: 'Old Café', category: 'CAFE', location: { type: 'Point', coordinates: [106.7, 10.77] },
      address: 'Old street', priceTier: 1, rating: 4, status: 'ACTIVE' };
    await venues.create(base);
    await views.create(base);
    const availability = { summaryForSlug: jest.fn().mockResolvedValue(null) } as unknown as AvailabilityService;
    const service = new VenuesService(venues, views, availability);
    const result = await service.updateBusinessProfile('demo-cafe', { name: 'New Café', address: 'New street',
      description: 'Cà phê tại trung tâm.', openingHours: '08:00-22:00', menuSummary: 'Cà phê, trà', priceTier: 2 });
    expect(result.data).toMatchObject({ name: 'New Café', openingHours: '08:00-22:00', menuSummary: 'Cà phê, trà', priceTier: 2 });
    expect(await views.findOne({ slug: 'demo-cafe' }, { name: 1, address: 1, priceTier: 1 }).lean()).toMatchObject({
      name: 'New Café', address: 'New street', priceTier: 2,
    });
    await service.setBusinessPremiumUntil('demo-cafe', new Date(Date.now() + 7 * 24 * 60 * 60_000));
    const campaign = await service.updateCampaign('demo-cafe', { promotionText: 'Ưu đãi thử nghiệm giờ vắng',
      startsAt: new Date(Date.now() - 60_000).toISOString(), endsAt: new Date(Date.now() + 60 * 60_000).toISOString(), sponsored: true });
    expect(campaign.data.sponsored).toBe(true);
    expect((await service.getBySlug('demo-cafe')).data.promotion).toMatchObject({ sponsored: true });
    expect((await views.findOne({ slug: 'demo-cafe' }))?.promotionText).toBe('Ưu đãi thử nghiệm giờ vắng');
    await service.clearCampaign('demo-cafe');
    expect((await service.getBySlug('demo-cafe')).data.promotion).toBeNull();
    await expect(service.updateBusinessProfile('missing', { name: 'Missing', address: 'Unknown street',
      description: '', openingHours: '', menuSummary: '', priceTier: 1 })).rejects.toThrow('Venue not found');
  });
});
