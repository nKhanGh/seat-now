export type Coordinates = [lng: number, lat: number];

function validCoordinate([lng, lat]: Coordinates) {
  return Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

export function directionsUrl(destination: Coordinates, origin?: Coordinates): string | null {
  if (!validCoordinate(destination)) return null;
  const params = new URLSearchParams({ api: '1', destination: `${destination[1]},${destination[0]}` });
  if (origin && validCoordinate(origin)) params.set('origin', `${origin[1]},${origin[0]}`);
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}
