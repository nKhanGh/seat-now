import mongoose, { Types } from 'mongoose';
import { randomUUID } from 'node:crypto';
import { VenueProposal, VenueProposalSchema } from '../schemas/venue-proposal.schema';
import { ProposalConfirmation, ProposalConfirmationSchema } from '../schemas/proposal-confirmation.schema';
import { ProposalsService } from '../services/proposals.service';
import { Venue, VenueSchema } from '../../map/schemas/venue.schema';
import { VenueMapView, VenueMapViewSchema } from '../../map/schemas/venue-map-view.schema';
import { VenuesService } from '../../venues/services/venues.service';

const testUri = process.env.MONGODB_TEST_URI;
const describeWithMongo = testUri ? describe : describe.skip;

describeWithMongo('community venue proposals with MongoDB', () => {
  const dbName = `seatnow_test_${randomUUID().replaceAll('-', '')}`;
  beforeAll(async () => {
    await mongoose.connect(testUri!, { dbName });
  });
  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });

  it('requires three other users and moderation before publishing to the map', async () => {
    const proposals = mongoose.model(VenueProposal.name, VenueProposalSchema);
    const confirmations = mongoose.model(ProposalConfirmation.name, ProposalConfirmationSchema);
    const venues = mongoose.model(Venue.name, VenueSchema);
    const views = mongoose.model(VenueMapView.name, VenueMapViewSchema);
    await Promise.all([proposals, confirmations, venues, views].map((model) => model.createIndexes()));
    const venueService = new VenuesService(venues, views, {} as never);
    const service = new ProposalsService(proposals, confirmations, venueService);
    const creator = new Types.ObjectId().toString();
    const input = {
      name: 'Quán thử cộng đồng',
      category: 'CAFE' as const,
      cuisineTypes: ['COFFEE'],
      description: 'Địa điểm hư cấu để kiểm tra đề xuất.',
      address: 'Đường thử nghiệm, Quận 1',
      lat: 10.7769,
      lng: 106.7009,
      priceTier: 2,
    };
    const proposal = (await service.create(creator, input)).data;
    await expect(service.confirm(creator, proposal.id)).rejects.toThrow('Cannot confirm your own proposal');
    for (let i = 0; i < 3; i++) await service.confirm(new Types.ObjectId().toString(), proposal.id);
    expect((await proposals.findById(proposal.id))?.status).toBe('READY_FOR_REVIEW');
    expect(await venues.countDocuments({ slug: proposal.slug })).toBe(0);
    expect(await views.countDocuments({ slug: proposal.slug })).toBe(0);
    await service.approve(proposal.id);
    await service.approve(proposal.id);
    expect(await venues.countDocuments({ slug: proposal.slug })).toBe(1);
    expect((await views.findOne({ slug: proposal.slug }))?.status).toBe('ACTIVE');
    expect((await service.list()).data.some((item) => item.id === proposal.id)).toBe(false);
  });
});
