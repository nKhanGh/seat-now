import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { VenuesModule } from '../venues/venues.module';
import { CheckInController } from './controllers/check-in.controller';
import { CheckIn, CheckInSchema } from './schemas/check-in.schema';
import { CheckInService } from './services/check-in.service';
import { Favorite, FavoriteSchema } from './schemas/favorite.schema';
import { FavoritesService } from './services/favorites.service';
import { FavoritesController } from './controllers/favorites.controller';

@Module({
  imports: [AuthModule, VenuesModule, MongooseModule.forFeature([
    { name: CheckIn.name, schema: CheckInSchema },
    { name: Favorite.name, schema: FavoriteSchema },
  ])],
  controllers: [CheckInController, FavoritesController],
  providers: [CheckInService, FavoritesService],
})
export class CommunityModule {}
