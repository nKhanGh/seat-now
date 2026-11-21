import 'reflect-metadata';
import { ConfigModule } from '@nestjs/config';
import mongoose from 'mongoose';
import { randomUUID } from 'node:crypto';
import { Venue, VenueSchema } from './map/schemas/venue.schema';
import { VenueMapView, VenueMapViewSchema } from './map/schemas/venue-map-view.schema';
import {
  AvailabilityLatest,
  AvailabilityLatestSchema,
  AvailabilitySnapshot,
  AvailabilitySnapshotSchema,
} from './availability/schemas/availability-snapshot.schema';
import { ParkingFacility, ParkingFacilitySchema } from './parking/schemas/parking-facility.schema';
import { ParkingSnapshot, ParkingSnapshotSchema } from './parking/schemas/parking-snapshot.schema';

const demoVenues = [
  {
    slug: 'demo-cafe-nguyen-hue',
    name: 'Cà phê Nguyễn Huệ',
    category: 'CAFE',
    cuisineTypes: ['COFFEE', 'DESSERT'],
    description: 'Quán cà phê mô phỏng gần phố đi bộ Nguyễn Huệ.',
    address: 'Nguyễn Huệ, Quận 1, TP.HCM',
    lng: 106.7038,
    lat: 10.7758,
    priceTier: 2,
    rating: 4.5,
    crowdLevel: 'QUIET',
    tables: { total: 20, available: 8 },
    seats: { total: 70, available: 26 },
    wait: 0,
  },
  {
    slug: 'demo-bistro-dong-khoi',
    name: 'Bistro Đồng Khởi',
    category: 'RESTAURANT',
    cuisineTypes: ['WESTERN'],
    description: 'Bistro mô phỏng phục vụ món Âu tại Đồng Khởi.',
    address: 'Đồng Khởi, Quận 1, TP.HCM',
    lng: 106.7049,
    lat: 10.7782,
    priceTier: 3,
    rating: 4.3,
    crowdLevel: 'MODERATE',
    tables: { total: 18, available: 4 },
    seats: { total: 64, available: 12 },
    wait: 10,
  },
  {
    slug: 'demo-cinema-le-loi',
    name: 'Rạp Ánh Dương · Lê Lợi',
    category: 'CINEMA',
    cuisineTypes: [],
    description: 'Rạp chiếu phim mô phỏng trên đường Lê Lợi.',
    address: 'Lê Lợi, Quận 1, TP.HCM',
    lng: 106.6989,
    lat: 10.7737,
    priceTier: 3,
    rating: 4.1,
    crowdLevel: 'BUSY',
    tables: null,
    seats: { total: 140, available: 18 },
    wait: 15,
  },
  {
    slug: 'demo-cafe-ben-thanh',
    name: 'Cà phê Bến Thành',
    category: 'CAFE',
    cuisineTypes: ['COFFEE'],
    description: 'Quán cà phê mô phỏng gần chợ Bến Thành.',
    address: 'Bến Thành, Quận 1, TP.HCM',
    lng: 106.6957,
    lat: 10.7721,
    priceTier: 1,
    rating: 4.0,
    crowdLevel: 'UNKNOWN',
    tables: null,
    seats: null,
    wait: null,
  },
  {
    slug: 'demo-restaurant-thao-dien',
    name: 'Bếp Thảo Điền',
    category: 'RESTAURANT',
    cuisineTypes: ['VIETNAMESE'],
    description: 'Nhà hàng món Việt mô phỏng tại Thảo Điền.',
    address: 'Thảo Điền, TP. Thủ Đức, TP.HCM',
    lng: 106.7319,
    lat: 10.8025,
    priceTier: 4,
    rating: 4.8,
    crowdLevel: 'QUIET',
    tables: { total: 30, available: 12 },
    seats: { total: 110, available: 42 },
    wait: 0,
  },
] as const;

const hcmAreas = [
  { name: 'Quận 1', lat: 10.7769, lng: 106.7009 },
  { name: 'Quận 3', lat: 10.7832, lng: 106.6837 },
  { name: 'Quận 4', lat: 10.7613, lng: 106.7031 },
  { name: 'Quận 5', lat: 10.7543, lng: 106.6675 },
  { name: 'Quận 10', lat: 10.7727, lng: 106.6678 },
  { name: 'Bình Thạnh', lat: 10.8014, lng: 106.7112 },
  { name: 'Phú Nhuận', lat: 10.7991, lng: 106.6816 },
  { name: 'Thảo Điền', lat: 10.8025, lng: 106.733 },
  { name: 'Quận 7', lat: 10.7292, lng: 106.7201 },
  { name: 'Tân Bình', lat: 10.8012, lng: 106.6523 },
] as const;

const cafeFirst = ['Mây', 'Nắng', 'Lá', 'Gió', 'Mộc', 'Sương', 'Hẻm', 'Hiên'];
const cafeLast = ['Ban Mai', 'Phố Nhỏ', 'Ven Sông', 'Tháng Tư'];
const restaurantFirst = [
  'Bếp Nhà',
  'Cơm Phố',
  'Mâm Việt',
  'Góc Bếp',
  'Nồi Đất',
  'Bếp Mộc',
  'Hương Quê',
  'Món Nhà',
];
const restaurantLast = ['Sài Gòn', 'Ven Sông', 'An Nhiên', 'Phố Nhỏ'];

const generatedVenues = Array.from({ length: 95 }, (_, index) => {
  const area = hcmAreas[index % hcmAreas.length];
  const number = String(index + 1).padStart(3, '0');
  const cafe = index % 3 !== 0;
  const nameIndex = Math.floor(index / 3);
  const name = cafe
    ? `Cà phê ${cafeFirst[nameIndex % cafeFirst.length]} ${cafeLast[Math.floor(nameIndex / cafeFirst.length)]}`
    : `${restaurantFirst[nameIndex % restaurantFirst.length]} ${restaurantLast[Math.floor(nameIndex / restaurantFirst.length)]}`;
  const angle = index * 2.39996;
  const radius = 0.002 + (index % 7) * 0.0012;
  const total = 12 + (index % 8) * 4;
  const available = index % 9 === 0 ? 0 : Math.max(1, Math.floor(total * (0.15 + (index % 5) * 0.12)));
  return {
    slug: `demo-hcm-${number}`,
    name: `${name} · ${area.name}`,
    category: cafe ? ('CAFE' as const) : ('RESTAURANT' as const),
    cuisineTypes: cafe ? ['COFFEE', 'DESSERT'] : [index % 2 === 0 ? 'VIETNAMESE' : 'WESTERN'],
    description: `Địa điểm hư cấu để thử bản đồ, bộ lọc và đánh giá tại ${area.name}, TP.HCM.`,
    address: `Khu vực ${area.name}, TP.HCM (địa chỉ mô phỏng)`,
    lat: Number((area.lat + Math.sin(angle) * radius).toFixed(5)),
    lng: Number((area.lng + Math.cos(angle) * radius).toFixed(5)),
    priceTier: (index % 4) + 1,
    rating: Number((3.7 + (index % 12) * 0.1).toFixed(1)),
    crowdLevel:
      available === 0
        ? ('FULL' as const)
        : index % 3 === 0
          ? ('BUSY' as const)
          : index % 3 === 1
            ? ('MODERATE' as const)
            : ('QUIET' as const),
    tables: { total, available },
    seats: { total: total * 4, available: available * 4 },
    wait: available === 0 ? 30 : index % 3 === 0 ? 10 : 0,
  };
});

const allDemoVenues = [...demoVenues, ...generatedVenues];

const demoParking = [
  {
    slug: 'demo-nguyen-hue-parking',
    name: 'Bãi xe Nguyễn Huệ',
    address: 'Nguyễn Huệ, Quận 1, TP.HCM',
    lng: 106.7041,
    lat: 10.7756,
    kind: 'VENUE',
    venueSlugs: ['demo-cafe-nguyen-hue'],
    vehicleTypes: ['MOTORBIKE'],
    open24h: false,
    entranceNote: 'Lối vào từ đường bên hông (mô phỏng)',
    pricing: { kind: 'FLAT', amountMinor: 10000, currency: 'VND', unit: 'VISIT', note: null },
    available: 12,
    total: 30,
  },
  {
    slug: 'demo-dong-khoi-parking',
    name: 'Bãi xe Đồng Khởi',
    address: 'Đồng Khởi, Quận 1, TP.HCM',
    lng: 106.7052,
    lat: 10.7785,
    kind: 'PARTNER',
    venueSlugs: ['demo-bistro-dong-khoi'],
    vehicleTypes: ['CAR', 'MOTORBIKE'],
    open24h: true,
    entranceNote: null,
    pricing: { kind: 'HOURLY', amountMinor: 20000, currency: 'VND', unit: 'HOUR', note: null },
    available: 5,
    total: 24,
  },
  {
    slug: 'demo-le-loi-public-parking',
    name: 'Bãi xe Lê Lợi',
    address: 'Lê Lợi, Quận 1, TP.HCM',
    lng: 106.6994,
    lat: 10.7741,
    kind: 'PUBLIC',
    venueSlugs: [],
    vehicleTypes: ['MOTORBIKE'],
    open24h: false,
    entranceNote: null,
    pricing: { kind: 'UNKNOWN', amountMinor: null, currency: null, unit: null, note: null },
    available: null,
    total: null,
  },
  {
    slug: 'demo-ben-thanh-public-parking',
    name: 'Bãi xe Bến Thành',
    address: 'Bến Thành, Quận 1, TP.HCM',
    lng: 106.6962,
    lat: 10.7718,
    kind: 'PUBLIC',
    venueSlugs: [],
    vehicleTypes: ['CAR', 'MOTORBIKE'],
    open24h: true,
    entranceNote: null,
    pricing: { kind: 'HOURLY', amountMinor: 15000, currency: 'VND', unit: 'HOUR', note: null },
    available: 0,
    total: 40,
  },
] as const;

async function seedDemo() {
  await ConfigModule.forRoot();
  if (process.env.NODE_ENV === 'production') throw new Error('Demo seed is disabled in production');
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required');
  await mongoose.connect(process.env.MONGODB_URI);
  try {
    const venues = mongoose.model(Venue.name, VenueSchema);
    const views = mongoose.model(VenueMapView.name, VenueMapViewSchema);
    const snapshots = mongoose.model(AvailabilitySnapshot.name, AvailabilitySnapshotSchema);
    const latest = mongoose.model(AvailabilityLatest.name, AvailabilityLatestSchema);
    const parking = mongoose.model(ParkingFacility.name, ParkingFacilitySchema);
    const parkingSnapshots = mongoose.model(ParkingSnapshot.name, ParkingSnapshotSchema);
    const capturedAt = new Date();
    const expiresAt = new Date(capturedAt.getTime() + 7 * 24 * 60 * 60_000);
    const version = capturedAt.getTime();
    for (const item of allDemoVenues) {
      const location = { type: 'Point', coordinates: [item.lng, item.lat] };
      const profile = {
        name: item.name,
        category: item.category,
        cuisineTypes: item.cuisineTypes,
        description: item.description,
        address: item.address,
        location,
        priceTier: item.priceTier,
        rating: item.rating,
        status: 'ACTIVE',
      };
      await venues.updateOne({ slug: item.slug }, { $set: profile }, { upsert: true });
      const availability =
        item.tables || item.seats
          ? {
              slug: item.slug,
              version,
              tables: item.tables,
              seats: item.seats,
              crowdLevel: item.crowdLevel,
              estimatedWaitMinutes: item.wait,
              acceptingGuests: true,
              source: 'DEMO',
              confidence: 0.8,
              capturedAt,
              expiresAt,
            }
          : null;
      if (availability) {
        await snapshots.create({ ...availability, sourceRecordId: randomUUID() });
        await latest.updateOne({ slug: item.slug }, { $set: availability }, { upsert: true });
      } else {
        await latest.deleteOne({ slug: item.slug });
      }
      await views.updateOne(
        { slug: item.slug },
        {
          $set: {
            ...profile,
            crowdLevel: availability?.crowdLevel ?? 'UNKNOWN',
            tablesAvailable: availability?.tables?.available ?? null,
            tablesTotal: availability?.tables?.total ?? null,
            seatsAvailable: availability?.seats?.available ?? null,
            seatsTotal: availability?.seats?.total ?? null,
            estimatedWaitMinutes: availability?.estimatedWaitMinutes ?? null,
            acceptingGuests: availability?.acceptingGuests ?? null,
            availabilitySource: availability?.source ?? null,
            availabilityConfidence: availability?.confidence ?? null,
            availabilityVersion: availability?.version ?? null,
            availabilityCapturedAt: availability?.capturedAt ?? null,
            availabilityExpiresAt: availability?.expiresAt ?? null,
          },
        },
        { upsert: true },
      );
    }
    for (const item of demoParking) {
      const availability =
        item.total !== null
          ? {
              availabilityVersion: version,
              availableSpaces: item.available,
              totalSpaces: item.total,
              availabilitySource: 'DEMO',
              availabilityConfidence: 0.8,
              availabilityCapturedAt: capturedAt,
              availabilityExpiresAt: expiresAt,
            }
          : {
              availabilityVersion: null,
              availableSpaces: null,
              totalSpaces: null,
              availabilitySource: null,
              availabilityConfidence: null,
              availabilityCapturedAt: null,
              availabilityExpiresAt: null,
            };
      await parking.updateOne(
        { slug: item.slug },
        {
          $set: {
            name: item.name,
            address: item.address,
            location: { type: 'Point', coordinates: [item.lng, item.lat] },
            kind: item.kind,
            venueSlugs: item.venueSlugs,
            vehicleTypes: item.vehicleTypes,
            open24h: item.open24h,
            entranceNote: item.entranceNote,
            pricing: item.pricing,
            status: 'ACTIVE',
            ...availability,
          },
        },
        { upsert: true },
      );
      if (item.total !== null) {
        await parkingSnapshots.create({
          facilitySlug: item.slug,
          version,
          availableSpaces: item.available,
          totalSpaces: item.total,
          source: 'DEMO',
          sourceRecordId: randomUUID(),
          confidence: 0.8,
          capturedAt,
          expiresAt,
        });
      }
    }
    console.log(
      `Seeded ${allDemoVenues.length} fictional demo venues and ${demoParking.length} parking facilities`,
    );
  } finally {
    await mongoose.disconnect();
  }
}

void seedDemo().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
