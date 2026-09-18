export const getLocationErrorMessage = (
  error: unknown,
): string => {
  const locationError =
    error as Partial<
      GeolocationPositionError
    >;

  if (
    typeof locationError.code ===
    'number'
  ) {
    switch (locationError.code) {
      case 1:
        return 'Location permission was denied. Allow location access in your browser, or search for a place manually.';

      case 2:
        return 'Your current location is unavailable. Try again or search for a place manually.';

      case 3:
        return 'Finding your current location took too long. Try again or search for a place manually.';

      default:
        return 'Your current location could not be detected.';
    }
  }

  if (
    error instanceof Error &&
    error.message
  ) {
    return error.message;
  }

  return 'Your current location could not be detected.';
};

export const getInvalidSearchMessage = (
  query: string,
): string | null => {
  const value = query.trim();

  if (!value) {
    return 'Enter a place name, address, or area to search.';
  }

  if (value.length < 2) {
    return 'Enter at least 2 characters to search for a place.';
  }

  return null;
};