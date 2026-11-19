import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AuthService } from '../../auth/services/auth.service';
import { Follow } from '../schemas/follow.schema';

@Injectable()
export class FollowsService {
  constructor(@InjectModel(Follow.name) private readonly follows: Model<Follow>, private readonly auth: AuthService) {}

  async publicProfile(userId: string) {
    const profile = await this.auth.publicProfileById(userId);
    const followers = await this.follows.countDocuments({ followingId: new Types.ObjectId(userId) });
    return { data: { ...profile, followers } };
  }

  async list(userId: string) {
    const rows = await this.follows.find({ followerId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1, _id: -1 }).limit(101).lean();
    const page = rows.slice(0, 100);
    const profiles = await this.auth.publicUsersByIds(page.map((row) => row.followingId));
    const byId = new Map(profiles.map((profile) => [profile.id, profile]));
    return { data: page.flatMap((row) => {
      const profile = byId.get(row.followingId.toString());
      return profile ? [{ ...profile, followedAt: row.createdAt }] : [];
    }), meta: { truncated: rows.length > 100 } };
  }

  async isFollowing(userId: string, targetId: string) {
    await this.auth.publicProfileById(targetId);
    const exists = await this.follows.exists({ followerId: new Types.ObjectId(userId), followingId: new Types.ObjectId(targetId) });
    return { data: { following: Boolean(exists) } };
  }

  async follow(userId: string, targetId: string) {
    if (userId === targetId) throw new BadRequestException({ code: 'FOLLOW_SELF', message: 'Cannot follow yourself' });
    await this.auth.publicProfileById(targetId);
    await this.follows.updateOne(
      { followerId: new Types.ObjectId(userId), followingId: new Types.ObjectId(targetId) },
      { $setOnInsert: { createdAt: new Date() } }, { upsert: true },
    );
    return { data: { following: true } };
  }

  async unfollow(userId: string, targetId: string) {
    if (!Types.ObjectId.isValid(targetId)) return { data: { following: false } };
    await this.follows.deleteOne({ followerId: new Types.ObjectId(userId), followingId: new Types.ObjectId(targetId) });
    return { data: { following: false } };
  }
}
