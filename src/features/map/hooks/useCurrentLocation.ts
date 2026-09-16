import {
  useCallback,
  useState,
} from 'react';

import {
  MapPoint,
} from '../types/placeSearch';

interface CurrentLocationState {
  error:
    GeolocationPositionError | null;

  isLocating: boolean;

  locate:
    () => Promise<MapPoint>;
}

export const useCurrentLocation =
  (): CurrentLocationState => {
    const [
      isLocating,
      setIsLocating,
    ] = useState(false);

    const [
      error,
      setError,
    ] =
      useState<
        GeolocationPositionError | null
      >(null);

    const locate =
      useCallback(
        async (): Promise<MapPoint> => {
          if (
            !navigator.geolocation
          ) {
            throw new Error(
              'Geolocation is not supported by this browser.',
            );
          }

          setIsLocating(true);
          setError(null);

          return new Promise<MapPoint>(
            (resolve, reject) => {
              navigator.geolocation
                .getCurrentPosition(
                  (position) => {
                    setIsLocating(false);

                    resolve({
                      lat:
                        position.coords
                          .latitude,

                      lng:
                        position.coords
                          .longitude,
                    });
                  },

                  (
                    locationError,
                  ) => {
                    setIsLocating(false);

                    setError(
                      locationError,
                    );

                    reject(
                      locationError,
                    );
                  },

                  {
                    enableHighAccuracy:
                      true,

                    maximumAge:
                      60_000,

                    timeout:
                      10_000,
                  },
                );
            },
          );
        },
        [],
      );

    return {
      error,
      isLocating,
      locate,
    };
  };