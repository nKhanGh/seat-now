export type Coordinates = [lng: number, lat: number];

export function distanceMeters(a: Coordinates, b: Coordinates) {
  const [lngA, latA] = a;
  const [lngB, latB] = b;
  const toRadians = Math.PI / 180;
  const latitudeDelta = (latB - latA) * toRadians;
  const longitudeDelta = (lngB - lngA) * toRadians;
  const arc =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(latA * toRadians) * Math.cos(latB * toRadians) * Math.sin(longitudeDelta / 2) ** 2;
  return Math.round(6_371_000 * 2 * Math.atan2(Math.sqrt(arc), Math.sqrt(1 - arc)));
}

export function venuesWithinRadius<T extends { location: { coordinates: Coordinates } }>(
  venues: T[],
  center: Coordinates,
  radiusM: number,
): T[] {
  return venues.filter((venue) => distanceMeters(center, venue.location.coordinates) <= radiusM);
}
