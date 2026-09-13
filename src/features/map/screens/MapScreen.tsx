import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  APIProvider,
  Map as GoogleMap,
  Marker,
  useMap,
} from '@vis.gl/react-google-maps';

import {
  AlertTriangle,
  LoaderCircle,
  MapPinned,
  MessageSquare,
  Navigation,
  RefreshCw,
  ShieldCheck,
  Star,
} from 'lucide-react';

import { useAppState } from '../../../core/hooks/useAppState';
import { useAccessibility } from '../../../core/hooks/useAccessibility';

import { TopHeader } from '../../../core/navigation/TopHeader';
import { BottomNav } from '../../../core/navigation/BottomNav';

import { getAccessiblePlaces } from '../../../services/placesService';

import { MapPin } from '../../../core/types/models';

import {
  AccessiblePlaceSearch,
} from '../components/AccessiblePlaceSearch';

import {
  MapPoint,
  PlaceSearchResult,
} from '../types/placeSearch';

import {
  sortPlacesByDistance,
} from '../utils/mapSearch';

/* =========================================================
   MAP CAMERA CONTROLLER
   ========================================================= */

interface MapCameraControllerProps {
  focusPoint: MapPoint;
}

const MapCameraController: React.FC<
  MapCameraControllerProps
> = ({
  focusPoint,
}) => {
  const map = useMap();

  useEffect(() => {
    if (!map) {
      return;
    }

    map.panTo({
      lat: focusPoint.lat,
      lng: focusPoint.lng,
    });

    if ((map.getZoom() ?? 0) < 14) {
      map.setZoom(14);
    }
  }, [
    focusPoint.lat,
    focusPoint.lng,
    map,
  ]);

  return null;
};

/* =========================================================
   GOOGLE MAP
   ========================================================= */

interface AccessiblePlacesMapProps {
  places: MapPin[];

  selectedPlace: MapPin;

  focusPoint: MapPoint;

  onSelect: (
    place: MapPin,
  ) => void;
}

const AccessiblePlacesMap: React.FC<
  AccessiblePlacesMapProps
> = ({
  places,
  selectedPlace,
  focusPoint,
  onSelect,
}) => {
  return (
    <GoogleMap
      className="h-full w-full"
      defaultCenter={{
        lat: selectedPlace.lat,
        lng: selectedPlace.lng,
      }}
      defaultZoom={13}
      disableDefaultUI
      gestureHandling="cooperative"
      reuseMaps
      zoomControl
    >
      <MapCameraController
        focusPoint={focusPoint}
      />

      {places.map((place) => (
        <Marker
          key={place.id}
          clickable
          label={
            selectedPlace.id ===
            place.id
              ? '✓'
              : undefined
          }
          onClick={() =>
            onSelect(place)
          }
          position={{
            lat: place.lat,
            lng: place.lng,
          }}
          title={`${place.title}. ${
            place.badge ??
            'Accessibility information available'
          }`}
          zIndex={
            selectedPlace.id ===
            place.id
              ? 10
              : 1
          }
        />
      ))}
    </GoogleMap>
  );
};

/* =========================================================
   MAP SCREEN
   ========================================================= */

export const MapScreen:
React.FC = () => {
  const {
    setActiveScreen,
  } = useAppState();

  const {
    settings,
    speakText,
  } = useAccessibility();

  /* -----------------------------
     Existing places
     ----------------------------- */

  const [
    places,
    setPlaces,
  ] =
    useState<MapPin[]>([]);

  const [
    selectedPlace,
    setSelectedPlace,
  ] =
    useState<MapPin | null>(
      null,
    );

  const [
    isLoading,
    setIsLoading,
  ] =
    useState(true);

  const [
    placesError,
    setPlacesError,
  ] =
    useState<
      string | null
    >(null);

  const [
    mapError,
    setMapError,
  ] =
    useState<
      string | null
    >(null);

  const [
    reloadKey,
    setReloadKey,
  ] =
    useState(0);

  /* -----------------------------
     AC-179 / AC-182 search state
     ----------------------------- */

  const [
    searchOrigin,
    setSearchOrigin,
  ] =
    useState<
      MapPoint | null
    >(null);

  const [
    mapFocusPoint,
    setMapFocusPoint,
  ] =
    useState<
      MapPoint | null
    >(null);

  const [
    searchLabel,
    setSearchLabel,
  ] =
    useState<
      string | null
    >(null);

  const listItemRefs =
    useRef<
      Record<
        string,
        HTMLButtonElement | null
      >
    >({});

  const googleMapsApiKey =
    import.meta.env
      .VITE_GOOGLE_MAPS_API_KEY
      ?.trim();

  /* =========================================================
     LOAD ACCESSIBLE PLACES
     ========================================================= */

  useEffect(() => {
    const controller =
      new AbortController();

    let isCurrentRequest =
      true;

    setIsLoading(true);

    setPlacesError(null);

    getAccessiblePlaces(
      controller.signal,
    )
      .then(
        (
          loadedPlaces,
        ) => {
          if (
            !isCurrentRequest
          ) {
            return;
          }

          setPlaces(
            loadedPlaces,
          );

          setSelectedPlace(
            (current) =>
              current &&
              loadedPlaces.some(
                (place) =>
                  place.id ===
                  current.id,
              )
                ? current
                : loadedPlaces[
                    0
                  ] ?? null,
          );
        },
      )
      .catch(
        (
          error: unknown,
        ) => {
          if (
            !isCurrentRequest
          ) {
            return;
          }

          if (
            error instanceof
              DOMException &&
            error.name ===
              'AbortError'
          ) {
            return;
          }

          setPlacesError(
            error instanceof
              Error
              ? error.message
              : 'Accessible places could not be loaded.',
          );
        },
      )
      .finally(() => {
        if (
          isCurrentRequest
        ) {
          setIsLoading(
            false,
          );
        }
      });

    return () => {
      isCurrentRequest =
        false;

      controller.abort();
    };
  }, [reloadKey]);

  /* =========================================================
     SORT PLACES BY SEARCH DISTANCE
     AC-182
     ========================================================= */

  const displayedPlaces =
    useMemo(
      () =>
        searchOrigin
          ? sortPlacesByDistance(
              places,
              searchOrigin,
            )
          : places,
      [
        places,
        searchOrigin,
      ],
    );

  /*
    When user searches a new
    location automatically select
    the nearest accessible place.
  */

  useEffect(() => {
    if (
      !searchOrigin ||
      displayedPlaces.length ===
        0
    ) {
      return;
    }

    setSelectedPlace(
      displayedPlaces[0],
    );
  }, [
    displayedPlaces,
    searchOrigin,
  ]);

  /* =========================================================
     SEARCH RESULT HANDLERS
     ========================================================= */

  const applySearchOrigin = (
    point: MapPoint,
    label: string,
  ) => {
    setSearchOrigin(
      point,
    );

    setMapFocusPoint(
      point,
    );

    setSearchLabel(
      label,
    );

    setMapError(null);

    if (
      settings.screenReader
    ) {
      speakText(
        `Map centered on ${label}. Nearby accessible places updated.`,
      );
    }
  };

  const handlePlaceSearchResult =
    (
      place:
        PlaceSearchResult,
    ) => {
      applySearchOrigin(
        {
          lat:
            place.lat,

          lng:
            place.lng,
        },
        place.name,
      );
    };

  /* =========================================================
     CURRENT MAP FOCUS
     ========================================================= */

  const focusPoint:
  MapPoint =
    mapFocusPoint ??
    (
      selectedPlace
        ? {
            lat:
              selectedPlace.lat,

            lng:
              selectedPlace.lng,
          }
        : {
            lat: 6.9271,
            lng: 79.8612,
          }
    );

  /* =========================================================
     SELECT ACCESSIBLE PLACE
     ========================================================= */

  const selectPlace = (
    place: MapPin,
    moveFocusToList =
      false,
  ) => {
    setSelectedPlace(
      place,
    );

    /*
      AC-179 improvement:
      Selecting map/list result
      should reposition map.
    */

    setMapFocusPoint({
      lat: place.lat,
      lng: place.lng,
    });

    if (
      settings.screenReader
    ) {
      speakText(
        `${place.title}. ${
          place.badge ??
          'Accessibility information is available.'
        }`,
      );
    }

    if (
      moveFocusToList
    ) {
      window.requestAnimationFrame(
        () =>
          listItemRefs.current[
            place.id
          ]?.focus(),
      );
    }
  };

  /* =========================================================
     UI
     ========================================================= */

  return (
    <div className="relative flex h-full min-h-[800px] w-full flex-col overflow-hidden bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-white">

      <TopHeader
        title="Accessible Places Directory"
      />

      <main className="flex-1 space-y-4 overflow-y-auto px-4 pb-5 pt-4">

        {/* PAGE INTRO */}

        <div>
          <h1
            id="map-directory-heading"
            className="text-xl font-extrabold text-slate-950 dark:text-white"
          >
            Accessible Places
            Directory
          </h1>

          <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            Search for a place
            or location and review
            nearby verified
            accessibility
            information.
          </p>
        </div>

        {/* LOADING */}

        {isLoading && (
          <div
            className="flex min-h-64 items-center justify-center rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
            role="status"
          >
            <span className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300">

              <LoaderCircle
                aria-hidden="true"
                className="h-5 w-5 animate-spin text-blue-600"
              />

              Loading accessible
              places…

            </span>
          </div>
        )}

        {/* PLACES LOAD ERROR */}

        {!isLoading &&
          placesError && (
            <div
              className="rounded-2xl border border-red-300 bg-red-50 p-4 text-red-900 dark:border-red-800 dark:bg-red-950/40 dark:text-red-100"
              role="alert"
            >
              <div className="flex items-start gap-2">

                <AlertTriangle
                  aria-hidden="true"
                  className="mt-0.5 h-5 w-5 shrink-0"
                />

                <div>
                  <h2 className="text-sm font-extrabold">
                    Places could
                    not be loaded
                  </h2>

                  <p className="mt-1 text-xs">
                    {
                      placesError
                    }
                  </p>

                  <button
                    onClick={() =>
                      setReloadKey(
                        (
                          value,
                        ) =>
                          value +
                          1,
                      )
                    }
                    className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl bg-red-700 px-4 py-2 text-xs font-extrabold text-white hover:bg-red-800"
                    type="button"
                  >
                    <RefreshCw
                      aria-hidden="true"
                      className="h-4 w-4"
                    />

                    Try again
                  </button>
                </div>

              </div>
            </div>
          )}

        {/* MAIN MAP CONTENT */}

        {!isLoading &&
          !placesError &&
          selectedPlace && (
            <>

              {/* GOOGLE SEARCH + MAP */}

              <section
                aria-label="Search and interactive accessible places map"
                className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >

                {googleMapsApiKey ? (

                  <APIProvider
                    apiKey={
                      googleMapsApiKey
                    }
                    libraries={[
                      'places',
                    ]}
                    onError={() =>
                      setMapError(
                        'Google Maps could not load. Check the API key restrictions and internet connection.',
                      )
                    }
                  >

                    {/* AC-179
                        ACCESSIBLE SEARCH FIELD */}

                    <div className="p-3">

                      <AccessiblePlaceSearch
                        onLocationSelected={
                          applySearchOrigin
                        }
                        onPlaceSelected={
                          handlePlaceSearchResult
                        }
                        origin={
                          searchOrigin
                        }
                      />

                    </div>

                    {/* MAP */}

                    <div className="h-64 w-full">

                      <AccessiblePlacesMap
                        focusPoint={
                          focusPoint
                        }
                        onSelect={(
                          place,
                        ) =>
                          selectPlace(
                            place,
                            true,
                          )
                        }
                        places={
                          displayedPlaces
                        }
                        selectedPlace={
                          selectedPlace
                        }
                      />

                    </div>

                  </APIProvider>

                ) : (

                  <div className="flex h-64 flex-col items-center justify-center px-6 text-center">

                    <MapPinned
                      aria-hidden="true"
                      className="h-10 w-10 text-blue-600"
                    />

                    <h2 className="mt-3 text-sm font-extrabold text-slate-900 dark:text-white">
                      Map setup
                      required
                    </h2>

                    <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                      Add your
                      restricted
                      Google Maps
                      browser key to{' '}
                      <code className="font-bold">
                        .env.local
                      </code>
                      . The
                      accessible
                      list below
                      remains fully
                      usable without
                      the visual map.
                    </p>

                  </div>

                )}

              </section>

              {/* GOOGLE MAP ERROR */}

              {mapError && (
                <p
                  className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100"
                  role="alert"
                >
                  {mapError}{' '}
                  Use the
                  accessible list
                  below instead.
                </p>
              )}

              {/* SCREEN READER ANNOUNCEMENT */}

              <p
                aria-live="polite"
                className="sr-only"
                role="status"
              >
                Selected{' '}
                {
                  selectedPlace.title
                }
                .{' '}
                {
                  selectedPlace.badge
                }
              </p>

              {/* ACCESSIBLE PLACES LIST */}

              <section
                aria-labelledby="places-list-heading"
              >

                <div className="mb-2 flex items-end justify-between gap-3">

                  <div>

                    <h2
                      id="places-list-heading"
                      className="text-base font-extrabold text-slate-950 dark:text-white"
                    >
                      Accessible
                      places list
                    </h2>

                    <p className="text-xs text-slate-500 dark:text-slate-400">

                      {
                        displayedPlaces.length
                      }{' '}
                      places
                      available

                      {searchLabel
                        ? ` near ${searchLabel}`
                        : ''}

                    </p>

                  </div>

                  <span className="rounded-full bg-teal-100 px-2.5 py-1 text-[10px] font-extrabold text-teal-800 dark:bg-teal-950 dark:text-teal-300">
                    Keyboard
                    accessible
                  </span>

                </div>

                <div
                  className="space-y-2"
                  role="list"
                >

                  {displayedPlaces.map(
                    (
                      place,
                    ) => {
                      const isSelected =
                        selectedPlace.id ===
                        place.id;

                      return (
                        <div
                          key={
                            place.id
                          }
                          role="listitem"
                        >

                          <button
                            ref={(
                              element,
                            ) => {
                              listItemRefs.current[
                                place.id
                              ] =
                                element;
                            }}
                            aria-pressed={
                              isSelected
                            }
                            onClick={() =>
                              selectPlace(
                                place,
                              )
                            }
                            className={`w-full rounded-2xl border p-3 text-left transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-950 ${
                              isSelected
                                ? 'border-blue-500 bg-blue-50 shadow-sm dark:bg-blue-950/40'
                                : 'border-slate-200 bg-white hover:border-blue-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-700'
                            }`}
                            type="button"
                          >

                            <span className="flex items-start gap-3">

                              <img
                                className="h-14 w-14 shrink-0 rounded-xl object-cover"
                                src={
                                  place.image
                                }
                                alt=""
                              />

                              <span className="min-w-0 flex-1">

                                <span className="flex items-start justify-between gap-2">

                                  <span className="text-sm font-extrabold text-slate-950 dark:text-white">
                                    {
                                      place.title
                                    }
                                  </span>

                                  <span className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400">

                                    <Star
                                      aria-hidden="true"
                                      className="h-3.5 w-3.5 fill-current"
                                    />

                                    {place.accessibilityRating.toFixed(
                                      1,
                                    )}

                                  </span>

                                </span>

                                <span className="mt-0.5 block text-[11px] text-slate-500 dark:text-slate-400">
                                  {
                                    place.address
                                  }
                                </span>

                                <span className="mt-1 block text-[11px] font-bold text-blue-600 dark:text-blue-400">
                                  {
                                    place.distance
                                  }
                                </span>

                                <span className="mt-2 flex flex-wrap gap-1">

                                  {place.accessibilityFeatures.map(
                                    (
                                      feature,
                                    ) => (
                                      <span
                                        key={
                                          feature
                                        }
                                        className="rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-bold text-teal-800 dark:bg-teal-950 dark:text-teal-300"
                                      >
                                        {
                                          feature
                                        }
                                      </span>
                                    ),
                                  )}

                                </span>

                              </span>

                            </span>

                          </button>

                        </div>
                      );
                    },
                  )}

                </div>

              </section>

              {/* SELECTED PLACE ACTIONS */}

              <section
                aria-label={`Actions for ${selectedPlace.title}`}
                className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >

                <div className="flex items-start justify-between gap-3">

                  <div>

                    <h2 className="text-sm font-extrabold text-slate-950 dark:text-white">
                      {
                        selectedPlace.title
                      }
                    </h2>

                    <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                      {
                        selectedPlace.distance
                      }
                    </p>

                  </div>

                  <span className="rounded-full bg-blue-100 px-2 py-1 text-[10px] font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    {
                      selectedPlace.type
                    }
                  </span>

                </div>

                <div className="mt-3 flex items-start gap-2 rounded-xl border border-teal-200 bg-teal-50 p-2.5 text-xs font-bold text-teal-900 dark:border-teal-800 dark:bg-teal-950/50 dark:text-teal-200">

                  <ShieldCheck
                    aria-hidden="true"
                    className="mt-0.5 h-4 w-4 shrink-0"
                  />

                  <span>
                    {
                      selectedPlace.badge
                    }
                  </span>

                </div>

                <div className="mt-3 flex gap-2">

                  <button
                    onClick={() =>
                      setActiveScreen(
                        'chat',
                      )
                    }
                    className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-slate-200 px-3 py-2 text-xs font-extrabold text-slate-800 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                    type="button"
                  >

                    <MessageSquare
                      aria-hidden="true"
                      className="h-4 w-4 text-blue-600"
                    />

                    Ask a question

                  </button>

                  <button
                    onClick={() =>
                      speakText(
                        `Starting accessible navigation to ${selectedPlace.title}`,
                      )
                    }
                    className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-xs font-extrabold text-white hover:bg-blue-700"
                    type="button"
                  >

                    <Navigation
                      aria-hidden="true"
                      className="h-4 w-4"
                    />

                    Navigate

                  </button>

                </div>

              </section>

            </>
          )}

      </main>

      <BottomNav />

    </div>
  );
};