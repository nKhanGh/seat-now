import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { randomBytes } from 'node:crypto';
import { Model, Types } from 'mongoose';
import { VenuesService } from '../../venues/services/venues.service';
import { CreateVenueProposalDto } from '../dto/venue-proposal.dto';
import { ProposalConfirmation } from '../schemas/proposal-confirmation.schema';
import { VenueProposal } from '../schemas/venue-proposal.schema';

const CONFIRMATIONS_REQUIRED = 3;

@Injectable()
export class ProposalsService {
  constructor(
    @InjectModel(VenueProposal.name) private readonly proposals: Model<VenueProposal>,
    @InjectModel(ProposalConfirmation.name) private readonly confirmations: Model<ProposalConfirmation>,
    private readonly venues: VenuesService,
  ) {}

  async create(userId: string, input: CreateVenueProposalDto) {
    const createdBy = new Types.ObjectId(userId);
    const today = new Date(Date.now() - 24 * 60 * 60 * 1000);
    if ((await this.proposals.countDocuments({ createdBy, createdAt: { $gte: today } })) >= 5) {
      throw new HttpException({ code: 'PROPOSAL_DAILY_LIMIT', message: 'Daily proposal limit reached' }, 429);
    }
    const name = input.name.trim();
    const address = input.address.trim();
    const description = input.description.trim();
    if (name.length < 3 || address.length < 5 || description.length < 10)
      throw new BadRequestException('Proposal fields are too short');
    const baseSlug =
      name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 60) || 'venue';
    const slug = `${baseSlug}-${randomBytes(4).toString('hex')}`;
    const proposal = await this.proposals.create({
      createdBy,
      slug,
      name,
      category: input.category,
      cuisineTypes: input.cuisineTypes,
      description,
      address,
      lat: input.lat,
      lng: input.lng,
      priceTier: input.priceTier,
    });
    return { data: this.toPublic(proposal) };
  }

  async list(status?: string) {
    const rows = await this.proposals
      .find({ status: status ?? { $in: ['PENDING', 'READY_FOR_REVIEW'] } })
      .sort({ createdAt: -1, _id: -1 })
      .limit(51)
      .lean();
    return {
      data: rows.slice(0, 50).map((row) => this.toPublic(row)),
      meta: { truncated: rows.length > 50 },
    };
  }

  async mine(userId: string) {
    const rows = await this.proposals
      .find({ createdBy: new Types.ObjectId(userId) })
      .sort({ createdAt: -1, _id: -1 })
      .limit(100)
      .lean();
    return { data: rows.map((row) => this.toPublic(row)) };
  }

  async confirm(userId: string, id: string) {
    const proposal = await this.findOpen(id);
    if (proposal.createdBy.toString() === userId)
      throw new BadRequestException({
        code: 'PROPOSAL_SELF_CONFIRM',
        message: 'Cannot confirm your own proposal',
      });
    let duplicate = false;
    try {
      await this.confirmations.create({ proposalId: proposal._id, userId: new Types.ObjectId(userId) });
    } catch (error) {
      if (!isDuplicate(error)) throw error;
      duplicate = true;
    }
    const confirmationCount = await this.confirmations.countDocuments({ proposalId: proposal._id });
    const status = confirmationCount >= CONFIRMATIONS_REQUIRED ? 'READY_FOR_REVIEW' : 'PENDING';
    await this.proposals.updateOne(
      { _id: proposal._id, status: { $in: ['PENDING', 'READY_FOR_REVIEW'] } },
      { $set: { confirmationCount, status } },
    );
    return { data: { id, duplicate, confirmationCount, status } };
  }

  async approve(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Proposal not found');
    const proposal = await this.proposals.findById(id);
    if (!proposal) throw new NotFoundException('Proposal not found');
    if (proposal.status === 'APPROVED') return { data: { slug: proposal.slug, status: 'APPROVED' } };
    if (proposal.status !== 'READY_FOR_REVIEW')
      throw new ConflictException('Proposal is not ready for review');
    await this.venues.publishProposal({
      slug: proposal.slug,
      name: proposal.name,
      category: proposal.category,
      cuisineTypes: proposal.cuisineTypes,
      description: proposal.description,
      address: proposal.address,
      lat: proposal.lat,
      lng: proposal.lng,
      priceTier: proposal.priceTier,
    });
    await this.proposals.updateOne(
      { _id: proposal._id, status: 'READY_FOR_REVIEW' },
      { $set: { status: 'APPROVED' } },
    );
    return { data: { slug: proposal.slug, status: 'APPROVED' } };
  }

  async reject(id: string) {
    const proposal = await this.findOpen(id);
    await this.proposals.updateOne(
      { _id: proposal._id, status: { $in: ['PENDING', 'READY_FOR_REVIEW'] } },
      { $set: { status: 'REJECTED' } },
    );
    return { data: { id, status: 'REJECTED' } };
  }

  private async findOpen(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Proposal not found');
    const proposal = await this.proposals.findById(id);
    if (!proposal) throw new NotFoundException('Proposal not found');
    if (!['PENDING', 'READY_FOR_REVIEW'].includes(proposal.status))
      throw new ConflictException('Proposal is closed');
    return proposal;
  }

  private toPublic(proposal: VenueProposal & { _id: Types.ObjectId }) {
    return {
      id: proposal._id.toString(),
      slug: proposal.slug,
      name: proposal.name,
      category: proposal.category,
      cuisineTypes: proposal.cuisineTypes,
      description: proposal.description,
      address: proposal.address,
      lat: proposal.lat,
      lng: proposal.lng,
      priceTier: proposal.priceTier,
      status: proposal.status,
      confirmationCount: proposal.confirmationCount,
      confirmationsRequired: CONFIRMATIONS_REQUIRED,
      createdAt: proposal.createdAt,
    };
  }
}

function isDuplicate(error: unknown): error is { code: number } {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;
}
