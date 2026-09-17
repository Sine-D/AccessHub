import React, {
  FormEvent,
  useId,
  useState,
} from 'react';

import {
  AlertTriangle,
  LoaderCircle,
  LocateFixed,
  Search,
} from 'lucide-react';

import {
  useCurrentLocation,
} from '../hooks/useCurrentLocation';

import {
  PlaceSuggestion,
  usePlaceAutocomplete,
} from '../hooks/usePlaceAutocomplete';

import {
  MapPoint,
  PlaceSearchResult,
} from '../types/placeSearch';

import {
  getInvalidSearchMessage,
  getLocationErrorMessage,
} from '../utils/mapSearchErrors';

interface AccessiblePlaceSearchProps {
  onLocationSelected:
    (
      point: MapPoint,
      label: string,
    ) => void;

  onPlaceSelected:
    (
      place: PlaceSearchResult,
    ) => void;

  origin?: MapPoint | null;
}

export const AccessiblePlaceSearch:
React.FC<AccessiblePlaceSearchProps> = ({
  onLocationSelected,
  onPlaceSelected,
  origin,
}) => {
  const inputId = useId();

  const listboxId =
    `${inputId}-suggestions`;

  const [query, setQuery] =
    useState('');

  const [
    activeIndex,
    setActiveIndex,
  ] = useState(-1);

  const [
    message,
    setMessage,
  ] =
    useState<string | null>(null);

  const {
    error: locationError,
    isLocating,
    locate,
  } = useCurrentLocation();

  const {
    error: autocompleteError,
    isLoading,
    selectSuggestion,
    suggestions,
  } =
    usePlaceAutocomplete(
      query,
      origin,
    );

  const chooseSuggestion =
    async (
      suggestion:
        PlaceSuggestion,
    ) => {
      try {
        setMessage(null);

        const place =
          await selectSuggestion(
            suggestion,
          );

        setQuery(place.name);
        setActiveIndex(-1);

        onPlaceSelected(place);
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : 'That place could not be opened. Try another search result.',
        );
      }
    };

  const handleSubmit = (
    event: FormEvent,
  ) => {
    event.preventDefault();

    const validationMessage =
      getInvalidSearchMessage(
        query,
      );

    if (validationMessage) {
      setMessage(
        validationMessage,
      );
      return;
    }

    if (
      suggestions.length === 0
    ) {
      setMessage(
        'No matching place is available yet. Keep typing or try a nearby city, road, or landmark.',
      );

      return;
    }

    void chooseSuggestion(
      suggestions[
        Math.max(
          activeIndex,
          0,
        )
      ],
    );
  };

  const handleCurrentLocation =
    async () => {
      try {
        setMessage(null);

        const point =
          await locate();

        setQuery(
          'Current location',
        );

        setActiveIndex(-1);

        onLocationSelected(
          point,
          'Current location',
        );
      } catch (error) {
        setMessage(
          getLocationErrorMessage(
            error,
          ),
        );
      }
    };

  const currentError =
    message ??
    autocompleteError ??
    (
      locationError
        ? getLocationErrorMessage(
            locationError,
          )
        : null
    );

  return (
    <section
      aria-labelledby={`${inputId}-heading`}
      className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900"
    >
      <h2
        id={`${inputId}-heading`}
        className="text-sm font-extrabold text-slate-950 dark:text-white"
      >
        Search places
      </h2>

      <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
        Search by place name,
        road, city, or area
        in Sri Lanka.
      </p>

      <form
        className="mt-3"
        onSubmit={
          handleSubmit
        }
        role="search"
      >
        <label
          className="text-xs font-bold text-slate-700 dark:text-slate-200"
          htmlFor={inputId}
        >
          Place name or
          location
        </label>

        <div className="relative mt-1 flex gap-2">

          <div className="relative min-w-0 flex-1">

            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400"
            />

            <input
              id={inputId}
              aria-autocomplete="list"
              aria-controls={
                listboxId
              }
              aria-expanded={
                suggestions.length >
                0
              }
              aria-activedescendant={
                activeIndex >= 0
                  ? `${inputId}-option-${activeIndex}`
                  : undefined
              }
              autoComplete="off"
              className="min-h-11 w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              onChange={(
                event,
              ) => {
                setQuery(
                  event.target
                    .value,
                );

                setActiveIndex(
                  -1,
                );

                setMessage(
                  null,
                );
              }}
              onKeyDown={(
                event,
              ) => {
                if (
                  suggestions.length ===
                  0
                ) {
                  return;
                }

                if (
                  event.key ===
                  'ArrowDown'
                ) {
                  event.preventDefault();

                  setActiveIndex(
                    (index) =>
                      Math.min(
                        index + 1,
                        suggestions.length -
                          1,
                      ),
                  );
                } else if (
                  event.key ===
                  'ArrowUp'
                ) {
                  event.preventDefault();

                  setActiveIndex(
                    (index) =>
                      Math.max(
                        index - 1,
                        0,
                      ),
                  );
                } else if (
                  event.key ===
                  'Escape'
                ) {
                  setActiveIndex(
                    -1,
                  );
                } else if (
                  event.key ===
                    'Enter' &&
                  activeIndex >= 0
                ) {
                  event.preventDefault();

                  void chooseSuggestion(
                    suggestions[
                      activeIndex
                    ],
                  );
                }
              }}
              placeholder="e.g. Colombo Fort"
              type="search"
              value={query}
            />

            {(
              isLoading ||
              suggestions.length >
                0
            ) && (
              <div
                className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900"
                id={
                  listboxId
                }
                role="listbox"
              >
                {isLoading && (
                  <div
                    className="flex items-center gap-2 p-3 text-xs text-slate-500"
                    role="status"
                  >
                    <LoaderCircle
                      aria-hidden="true"
                      className="h-4 w-4 animate-spin"
                    />

                    Finding places…
                  </div>
                )}

                {!isLoading &&
                  suggestions.map(
                    (
                      suggestion,
                      index,
                    ) => (
                      <button
                        id={`${inputId}-option-${index}`}
                        aria-selected={
                          activeIndex ===
                          index
                        }
                        className={`block w-full border-t border-slate-100 px-3 py-2.5 text-left first:border-t-0 dark:border-slate-800 ${
                          activeIndex ===
                          index
                            ? 'bg-blue-50 dark:bg-blue-950/40'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                        key={
                          suggestion.id
                        }
                        onClick={() =>
                          void chooseSuggestion(
                            suggestion,
                          )
                        }
                        onMouseEnter={() =>
                          setActiveIndex(
                            index,
                          )
                        }
                        role="option"
                        type="button"
                      >
                        <span className="block text-xs font-extrabold text-slate-900 dark:text-white">
                          {
                            suggestion.mainText
                          }
                        </span>

                        {suggestion.secondaryText && (
                          <span className="mt-0.5 block text-[11px] text-slate-500 dark:text-slate-400">
                            {
                              suggestion.secondaryText
                            }
                          </span>
                        )}

                      </button>
                    ),
                  )}
              </div>
            )}

          </div>

          <button
            aria-label="Use my current location"
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-1 rounded-xl bg-teal-600 px-3 text-xs font-extrabold text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={
              isLocating
            }
            onClick={() =>
              void handleCurrentLocation()
            }
            type="button"
          >
            {isLocating ? (
              <LoaderCircle
                aria-hidden="true"
                className="h-4 w-4 animate-spin"
              />
            ) : (
              <LocateFixed
                aria-hidden="true"
                className="h-4 w-4"
              />
            )}

            <span className="hidden sm:inline">
              My location
            </span>

          </button>

        </div>

      </form>

      {currentError && (
        <div
          className="mt-3 flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-2.5 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100"
          role="alert"
        >
          <AlertTriangle
            aria-hidden="true"
            className="mt-0.5 h-4 w-4 shrink-0"
          />

          <span>
            {currentError}
          </span>

        </div>
      )}

    </section>
  );
};