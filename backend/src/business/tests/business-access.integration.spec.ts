import mongoose, { Types } from 'mongoose';
import { randomUUID } from 'node:crypto';
import { AuthService } from '../../auth/services/auth.service';
import { VenuesService } from '../../venues/services/venues.service';
import { BusinessAccess, BusinessAccessSchema } from '../schemas/business-access.schema';
import { BusinessClaim, BusinessClaimSchema } from '../schemas/business-claim.schema';
import { BusinessAccessService } from '../services/business-access.service';

const testUri = process.env.MONGODB_TEST_URI;
const describeWithMongo = testUri ? describe : describe.skip;

describeWithMongo('business ownership with MongoDB', () => {
  const dbName = `seatnow_test_${randomUUID().replaceAll('-', '')}`;
  beforeAll(async () => { await mongoose.connect(testUri!, { dbName }); });
  afterAll(async () => { await mongoose.connection.dropDatabase(); await mongoose.disconnect(); });

  it('requires operator approval and isolates venue management by owner', async () => {
    const claims = mongoose.model(BusinessClaim.name, BusinessClaimSchema);
    const access = mongoose.model(BusinessAccess.name, BusinessAccessSchema);
    await Promise.all([claims.createIndexes(), access.createIndexes()]);
    const venues = {
      activeLocation: jest.fn().mockResolvedValue([106.7, 10.77]),
      publicProfilesBySlugs: jest.fn().mockResolvedValue([{ slug: 'demo-cafe', name: 'Demo Café' }]),
    } as unknown as VenuesService;
    const auth = { publicProfileById: jest.fn().mockResolvedValue({ displayName: 'Owner' }) } as unknown as AuthService;
    const service = new BusinessAccessService(claims, access, venues, auth);
    const ownerId = new Types.ObjectId().toString();
    const otherId = new Types.ObjectId().toString();
    const claim = await service.requestClaim(ownerId, 'demo-cafe', 'Tôi có giấy tờ quản lý quán này.');
    expect(claim.data.status).toBe('PENDING');
    expect((await service.myVenues(ownerId)).data).toHaveLength(0);
    await expect(service.requireOwner(ownerId, 'demo-cafe')).rejects.toThrow('Venue management access required');
    await expect(service.requestClaim(ownerId, 'demo-cafe', 'Tôi có giấy tờ quản lý quán này.')).rejects.toThrow('Claim already submitted');
    await service.approveClaim(claim.data.id);
    expect((await service.myClaims(ownerId)).data[0].status).toBe('APPROVED');
    expect((await service.myVenues(ownerId)).data).toMatchObject([{ slug: 'demo-cafe', plan: 'FREE', verified: false }]);
    await service.requireOwner(ownerId, 'demo-cafe');
    await expect(service.requireOwner(otherId, 'demo-cafe')).rejects.toThrow('Venue management access required');
    await expect(service.requireOwner(ownerId, 'demo-cafe', true)).rejects.toThrow('Premium business plan required');
    await expect(service.requestClaim(otherId, 'demo-cafe', 'Tôi cũng có giấy tờ quản lý quán.')).rejects.toThrow('Venue already managed');
    expect((await service.approveClaim(claim.data.id)).data.status).toBe('APPROVED');
  });
});
