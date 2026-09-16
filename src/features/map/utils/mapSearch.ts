import { MapPin } from '../../../core/types/models';
import { MapPoint } from '../types/placeSearch';

const EARTH_RADIUS_KM = 6371;

const toRadians = (value: number) =>
  (value * Math.PI) / 180;

export const calculateDistanceKm = (
  from: MapPoint,
  to: MapPoint,
): number => {
  const latitudeDifference =
    toRadians(to.lat - from.lat);

  const longitudeDifference =
    toRadians(to.lng - from.lng);

  const fromLatitude =
    toRadians(from.lat);

  const toLatitude =
    toRadians(to.lat);

  const haversine =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(fromLatitude) *
      Math.cos(toLatitude) *
      Math.sin(longitudeDifference / 2) ** 2;

  return (
    2 *
    EARTH_RADIUS_KM *
    Math.asin(Math.sqrt(haversine))
  );
};

export const formatDistance = (
  distanceKm: number,
): string => {
  if (distanceKm < 1) {
    return `${Math.round(
      distanceKm * 1000,
    )} m away`;
  }

  return `${distanceKm.toFixed(
    distanceKm < 10 ? 1 : 0,
  )} km away`;
};

export const sortPlacesByDistance = (
  places: MapPin[],
  origin: MapPoint,
): MapPin[] =>
  [...places]
    .map((place) => {
      const distanceKm =
        calculateDistanceKm(origin, {
          lat: place.lat,
          lng: place.lng,
        });

      return {
        ...place,
        distance:
          formatDistance(distanceKm),
        __distanceKm: distanceKm,
      };
    })
    .sort(
      (first, second) =>
        first.__distanceKm -
        second.__distanceKm,
    )
    .map(
      ({
        __distanceKm: _distanceKm,
        ...place
      }) => place,
    );