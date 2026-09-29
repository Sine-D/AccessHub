export function buildDirectionsUrl(point: { lat: number; lng: number }): string {
  if (
    !Number.isFinite(point.lat) ||
    !Number.isFinite(point.lng) ||
    point.lat < -90 ||
    point.lat > 90 ||
    point.lng < -180 ||
    point.lng > 180
  ) {
    throw new Error('Invalid destination coordinates.');
  }
  const url = new URL('https://www.google.com/maps/dir/');
  url.searchParams.set('api', '1');
  url.searchParams.set('destination', `${point.lat},${point.lng}`);
  return url.toString();
}

