import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AvailabilityService } from '../../availability/services/availability.service';
import { Venue } from '../../map/schemas/venue.schema';
import { VenueMapView } from '../../map/schemas/venue-map-view.schema';
import type { UpdateBusinessProfileDto } from '../../business/dto/update-business-profile.dto';
import type { UpdateCampaignDto } from '../../business/dto/update-campaign.dto';

@Injectable()
export class VenuesService {
  constructor(
    @InjectModel(Venue.name) private readonly venues: Model<Venue>,
    @InjectModel(VenueMapView.name) private readonly views: Model<VenueMapView>,
    private readonly availability: AvailabilityService,
  ) {}

  async publishProposal(profile: {
    slug: string;
    name: string;
    category: 'RESTAURANT' | 'CAFE' | 'CINEMA';
    cuisineTypes: string[];
    description: string;
    address: string;
    lat: number;
    lng: number;
    priceTier: number;
  }) {
    const publicFields = {
      name: profile.name,
      category: profile.category,
      cuisineTypes: profile.cuisineTypes,
      address: profile.address,
      location: { type: 'Point' as const, coordinates: [profile.lng, profile.lat] as [number, number] },
      priceTier: profile.priceTier,
      rating: 0,
      status: 'ACTIVE',
    };
    await this.venues.updateOne(
      { slug: profile.slug },
      { $setOnInsert: { ...publicFields, description: profile.description } },
      { upsert: true },
    );
    await this.views.updateOne({ slug: profile.slug }, { $setOnInsert: publicFields }, { upsert: true });
    return { slug: profile.slug };
  }

  async activeLocation(slug: string): Promise<[number, number]> {
    const venue = await this.venues.findOne({ slug, status: 'ACTIVE' }, { location: 1 }).lean();
    if (!venue) throw new NotFoundException('Venue not found');
    return venue.location.coordinates;
  }

  async updateBusinessProfile(slug: string, input: UpdateBusinessProfileDto) {
    const profile = {
      name: input.name.trim(),
      address: input.address.trim(),
      description: input.description.trim(),
      openingHours: input.openingHours.trim(),
      menuSummary: input.menuSummary.trim(),
      priceTier: input.priceTier,
    };
    if (profile.name.length < 3 || profile.address.length < 5)
      throw new BadRequestException('Invalid venue profile');
    const result = await this.venues.updateOne({ slug, status: 'ACTIVE' }, { $set: profile });
    if (!result.matchedCount) throw new NotFoundException('Venue not found');
    await this.views.updateOne(
      { slug, status: 'ACTIVE' },
      {
        $set: {
          name: profile.name,
          address: profile.address,
          priceTier: profile.priceTier,
        },
      },
    );
    return this.getBySlug(slug);
  }

  async setBusinessPremiumUntil(slug: string, premiumExpiresAt: Date | null) {
    const result = await this.venues.updateOne(
      { slug, status: 'ACTIVE' },
      { $set: { businessPremiumExpiresAt: premiumExpiresAt } },
    );
    if (!result.matchedCount) throw new NotFoundException('Venue not found');
    await this.views.updateOne(
      { slug, status: 'ACTIVE' },
      { $set: { businessPremiumExpiresAt: premiumExpiresAt } },
    );
  }

  async setHasLogo(slug: string) {
    const result = await this.venues.updateOne({ slug, status: 'ACTIVE' }, { $set: { hasLogo: true } });
    if (!result.matchedCount) throw new NotFoundException('Venue not found');
    await this.views.updateOne({ slug, status: 'ACTIVE' }, { $set: { hasLogo: true } });
  }

  async setHasCover(slug: string) {
    const result = await this.venues.updateOne({ slug, status: 'ACTIVE' }, { $set: { hasCover: true } });
    if (!result.matchedCount) throw new NotFoundException('Venue not found');
    await this.views.updateOne({ slug, status: 'ACTIVE' }, { $set: { hasCover: true } });
  }

  async updateCampaign(slug: string, input: UpdateCampaignDto) {
    const startsAt = new Date(input.startsAt);
    const endsAt = new Date(input.endsAt);
    const now = Date.now();
    const promotionText = input.promotionText.trim();
    if (
      promotionText.length < 10 ||
      !Number.isFinite(startsAt.getTime()) ||
      !Number.isFinite(endsAt.getTime()) ||
      endsAt <= startsAt ||
      endsAt.getTime() <= now ||
      startsAt.getTime() < now - 24 * 60 * 60_000 ||
      startsAt.getTime() > now + 30 * 24 * 60 * 60_000 ||
      endsAt.getTime() > now + 31 * 24 * 60 * 60_000
    ) {
      throw new BadRequestException('Campaign must be valid and within 31 days');
    }
    const campaign = {
      promotionText,
      promotionStartsAt: startsAt,
      promotionEndsAt: endsAt,
      sponsored: input.sponsored,
    };
    const result = await this.venues.updateOne({ slug, status: 'ACTIVE' }, { $set: campaign });
    if (!result.matchedCount) throw new NotFoundException('Venue not found');
    await this.views.updateOne({ slug, status: 'ACTIVE' }, { $set: campaign });
    return { data: { slug, ...campaign } };
  }

  async clearCampaign(slug: string) {
    const campaign = {
      promotionText: null,
      promotionStartsAt: null,
      promotionEndsAt: null,
      sponsored: false,
    };
    const result = await this.venues.updateOne({ slug, status: 'ACTIVE' }, { $set: campaign });
    if (!result.matchedCount) throw new NotFoundException('Venue not found');
    await this.views.updateOne({ slug, status: 'ACTIVE' }, { $set: campaign });
    return { data: { slug, active: false } };
  }

  async publicProfilesBySlugs(slugs: string[]) {
    const venues = await this.venues
      .find(
        { slug: { $in: slugs }, status: 'ACTIVE' },
        {
          slug: 1,
          name: 1,
          category: 1,
          address: 1,
          description: 1,
          openingHours: 1,
          menuSummary: 1,
          location: 1,
          priceTier: 1,
          rating: 1,
          hasLogo: 1,
          hasCover: 1,
          businessPremiumExpiresAt: 1,
          promotionText: 1,
          promotionStartsAt: 1,
          promotionEndsAt: 1,
          sponsored: 1,
        },
      )
      .lean();
    return venues.map((venue) => ({
      slug: venue.slug,
      name: venue.name,
      category: venue.category,
      address: venue.address,
      description: venue.description ?? '',
      openingHours: venue.openingHours ?? '',
      menuSummary: venue.menuSummary ?? '',
      location: venue.location,
      priceTier: venue.priceTier,
      rating: venue.rating,
      logoUrl: venue.hasLogo ? `/api/v1/venues/${encodeURIComponent(venue.slug)}/logo` : null,
      coverUrl:
        venue.hasCover && venue.businessPremiumExpiresAt && venue.businessPremiumExpiresAt > new Date()
          ? `/api/v1/venues/${encodeURIComponent(venue.slug)}/cover`
          : null,
      promotion:
        venue.businessPremiumExpiresAt &&
        venue.businessPremiumExpiresAt > new Date() &&
        venue.promotionText &&
        venue.promotionStartsAt &&
        venue.promotionEndsAt &&
        venue.promotionStartsAt <= new Date() &&
        venue.promotionEndsAt > new Date()
          ? {
              text: venue.promotionText,
              startsAt: venue.promotionStartsAt,
              endsAt: venue.promotionEndsAt,
              sponsored: venue.sponsored,
            }
          : null,
    }));
  }

  async getBySlug(slug: string) {
    const venue = await this.venues.findOne({ slug, status: 'ACTIVE' }).lean();
    if (!venue) throw new NotFoundException('Venue not found');
    return {
      data: {
        id: venue._id.toString(),
        slug: venue.slug,
        name: venue.name,
        category: venue.category,
        cuisineTypes: venue.cuisineTypes ?? [],
        description: venue.description ?? '',
        openingHours: venue.openingHours ?? '',
        menuSummary: venue.menuSummary ?? '',
        address: venue.address,
        location: venue.location,
        priceTier: venue.priceTier,
        rating: venue.rating,
        verified: Boolean(venue.businessPremiumExpiresAt && venue.businessPremiumExpiresAt > new Date()),
        logoUrl: venue.hasLogo ? `/api/v1/venues/${encodeURIComponent(venue.slug)}/logo` : null,
        coverUrl:
          venue.hasCover && venue.businessPremiumExpiresAt && venue.businessPremiumExpiresAt > new Date()
            ? `/api/v1/venues/${encodeURIComponent(venue.slug)}/cover`
            : null,
        promotion:
          venue.businessPremiumExpiresAt &&
          venue.businessPremiumExpiresAt > new Date() &&
          venue.promotionText &&
          venue.promotionStartsAt &&
          venue.promotionEndsAt &&
          venue.promotionStartsAt <= new Date() &&
          venue.promotionEndsAt > new Date()
            ? {
                text: venue.promotionText,
                startsAt: venue.promotionStartsAt,
                endsAt: venue.promotionEndsAt,
                sponsored: venue.sponsored,
              }
            : null,
        availability: await this.availability.summaryForSlug(slug),
      },
    };
  }
}
