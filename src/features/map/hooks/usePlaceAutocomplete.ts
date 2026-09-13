/// <reference types="google.maps" />

import {
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  useMapsLibrary,
} from '@vis.gl/react-google-maps';

import {
  MapPoint,
  PlaceSearchResult,
} from '../types/placeSearch';

export interface PlaceSuggestion {
  id: string;
  label: string;
  mainText: string;
  secondaryText: string;
  prediction:
    google.maps.places.PlacePrediction;
}

interface UsePlaceAutocompleteResult {
  error: string | null;
  isLoading: boolean;

  selectSuggestion: (
    suggestion: PlaceSuggestion,
  ) => Promise<PlaceSearchResult>;

  suggestions: PlaceSuggestion[];
}

export const usePlaceAutocomplete = (
  query: string,
  origin?: MapPoint | null,
): UsePlaceAutocompleteResult => {
  const placesLibrary =
    useMapsLibrary('places');

  const sessionTokenRef =
    useRef<
      google.maps.places.AutocompleteSessionToken | null
    >(null);

  const requestIdRef = useRef(0);

  const [suggestions, setSuggestions] =
    useState<PlaceSuggestion[]>([]);

  const [isLoading, setIsLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    const cleanQuery = query.trim();

    if (
      !placesLibrary ||
      cleanQuery.length < 2
    ) {
      setSuggestions([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    if (!sessionTokenRef.current) {
      sessionTokenRef.current =
        new placesLibrary
          .AutocompleteSessionToken();
    }

    const requestId =
      ++requestIdRef.current;

    const timeoutId =
      window.setTimeout(() => {
        setIsLoading(true);
        setError(null);

        placesLibrary
          .AutocompleteSuggestion
          .fetchAutocompleteSuggestions({
            input: cleanQuery,
            language: 'en',
            region: 'lk',

            origin:
              origin ?? undefined,

            sessionToken:
              sessionTokenRef.current ??
              undefined,
          })
          .then(
            ({
              suggestions:
                rawSuggestions,
            }: {
              suggestions:
                google.maps.places.AutocompleteSuggestion[];
            }) => {
              if (
                requestId !==
                requestIdRef.current
              ) {
                return;
              }

              const nextSuggestions =
                rawSuggestions
                  .map(
                    (
                      suggestion:
                        google.maps.places.AutocompleteSuggestion,
                    ) =>
                      suggestion.placePrediction,
                  )
                  .filter(
                    (
                      prediction:
                        google.maps.places.PlacePrediction |
                        null,
                    ): prediction is
                      google.maps.places.PlacePrediction =>
                      Boolean(prediction),
                  )
                  .map(
                    (
                      prediction:
                        google.maps.places.PlacePrediction,
                    ) => ({
                      id:
                        prediction.placeId,

                      label:
                        prediction.text.toString(),

                      mainText:
                        prediction.mainText
                          ?.text ??
                        prediction.text
                          .toString(),

                      secondaryText:
                        prediction
                          .secondaryText
                          ?.text ?? '',

                      prediction,
                    }),
                  );

              setSuggestions(
                nextSuggestions,
              );
            },
          )
          .catch(() => {
            if (
              requestId !==
              requestIdRef.current
            ) {
              return;
            }

            setSuggestions([]);

            setError(
              'Place suggestions could not be loaded. Check your connection and Google Places API configuration.',
            );
          })
          .finally(() => {
            if (
              requestId ===
              requestIdRef.current
            ) {
              setIsLoading(false);
            }
          });
      }, 300);

    return () =>
      window.clearTimeout(timeoutId);
  }, [
    origin,
    placesLibrary,
    query,
  ]);

  const selectSuggestion = async (
    suggestion: PlaceSuggestion,
  ): Promise<PlaceSearchResult> => {
    const place =
      suggestion.prediction.toPlace();

    await place.fetchFields({
      fields: [
        'displayName',
        'formattedAddress',
        'location',
      ],
    });

    if (!place.location) {
      throw new Error(
        'The selected place does not provide a map location.',
      );
    }

    sessionTokenRef.current = null;

    setSuggestions([]);

    return {
      address:
        place.formattedAddress ??
        suggestion.label,

      lat:
        place.location.lat(),

      lng:
        place.location.lng(),

      name:
        place.displayName ??
        suggestion.mainText,

      placeId:
        place.id,
    };
  };

  return {
    error,
    isLoading,
    selectSuggestion,
    suggestions,
  };
};