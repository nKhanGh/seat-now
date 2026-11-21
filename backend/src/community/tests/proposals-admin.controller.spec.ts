import { ForbiddenException } from '@nestjs/common';
import { Types } from 'mongoose';
import { AuthService } from '../../auth/services/auth.service';
import { ProposalsController } from '../controllers/proposals.controller';
import { ProposalsService } from '../services/proposals.service';

describe('ProposalsController admin authorization', () => {
  const request = { cookies: { seatnow_sid: 'session-token' } } as unknown as Parameters<
    ProposalsController['adminReadyProposals']
  >[0];
  const createdBy = new Types.ObjectId().toString();
  const readyForReview = jest.fn().mockResolvedValue({
    data: [{ id: 'proposal-id', createdBy, name: 'Quán thử' }],
    meta: { truncated: false },
  });
  const approve = jest.fn().mockResolvedValue({ data: { status: 'APPROVED' } });
  const reject = jest.fn().mockResolvedValue({ data: { status: 'REJECTED' } });
  const proposals = { readyForReview, approve, reject } as unknown as ProposalsService;
  const authenticate = jest.fn();
  const adminUsersByIds = jest
    .fn()
    .mockResolvedValue([{ id: createdBy, displayName: 'Người đề xuất', email: 'user@example.invalid' }]);
  const auth = { authenticate, adminUsersByIds } as unknown as AuthService;
  const controller = new ProposalsController(proposals, auth);

  beforeEach(() => jest.clearAllMocks());

  it('blocks a normal account before reading or deciding proposals', async () => {
    authenticate.mockResolvedValue({ role: 'USER' });
    await expect(controller.adminReadyProposals(request)).rejects.toBeInstanceOf(ForbiddenException);
    await expect(controller.adminApprove(request, 'proposal-id')).rejects.toBeInstanceOf(ForbiddenException);
    await expect(controller.adminReject(request, 'proposal-id')).rejects.toBeInstanceOf(ForbiddenException);
    expect(readyForReview).not.toHaveBeenCalled();
    expect(approve).not.toHaveBeenCalled();
    expect(reject).not.toHaveBeenCalled();
  });

  it('lets an admin inspect the applicant and approve or reject', async () => {
    authenticate.mockResolvedValue({ role: 'ADMIN' });
    await expect(controller.adminReadyProposals(request)).resolves.toEqual({
      data: [
        {
          id: 'proposal-id',
          name: 'Quán thử',
          applicant: { id: createdBy, displayName: 'Người đề xuất', email: 'user@example.invalid' },
        },
      ],
      meta: { truncated: false },
    });
    await controller.adminApprove(request, 'proposal-id');
    await controller.adminReject(request, 'proposal-id');
    expect(authenticate).toHaveBeenCalledWith('session-token');
    expect(approve).toHaveBeenCalledWith('proposal-id');
    expect(reject).toHaveBeenCalledWith('proposal-id');
  });
});
