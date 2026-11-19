import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { VenuePageView } from '../schemas/venue-page-view.schema';

@Injectable()
export class VenuePageViewService {
  constructor(@InjectModel(VenuePageView.name) private readonly views: Model<VenuePageView>) {}

  async record(slug: string) {
    const hourStart = new Date(Math.floor(Date.now() / 3_600_000) * 3_600_000);
    try {
      await this.views.updateOne({ slug, hourStart }, { $inc: { count: 1 } }, { upsert: true });
    } catch (error) {
      if (!(typeof error === 'object' && error !== null && 'code' in error && error.code === 11000)) throw error;
      await this.views.updateOne({ slug, hourStart }, { $inc: { count: 1 } });
    }
  }

  async sevenDaySummary(slug: string) {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60_000);
    const rows = await this.views.find({ slug, hourStart: { $gte: since } }, { hourStart: 1, count: 1 })
      .sort({ hourStart: -1 }).limit(169).lean();
    const byHour = Array.from({ length: 24 }, (_, hour) => ({ hourUtc: hour, count: 0 }));
    for (const row of rows) byHour[row.hourStart.getUTCHours()].count += row.count;
    return { total: rows.reduce((sum, row) => sum + row.count, 0), byHour, truncated: rows.length > 168 };
  }
}
