import 'reflect-metadata';
import { ConfigModule } from '@nestjs/config';
import mongoose from 'mongoose';
import { User, UserSchema } from './auth/schemas/user.schema';
import { Session, SessionSchema } from './auth/schemas/session.schema';
import { VenueMapView, VenueMapViewSchema } from './map/schemas/venue-map-view.schema';
import { Venue, VenueSchema } from './map/schemas/venue.schema';

async function createIndexes() {
  await ConfigModule.forRoot();
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is required');
  await mongoose.connect(uri);
  try {
    await mongoose.model(User.name, UserSchema).createIndexes();
    await mongoose.model(Session.name, SessionSchema).createIndexes();
    await mongoose.model(VenueMapView.name, VenueMapViewSchema).createIndexes();
    await mongoose.model(Venue.name, VenueSchema).createIndexes();
  } finally {
    await mongoose.disconnect();
  }
}

void createIndexes().catch((error: unknown) => {
  console.error('Failed to create MongoDB indexes', error);
  process.exitCode = 1;
});
