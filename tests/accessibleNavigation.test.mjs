import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getAccessibilityDirections,
  findClosestAccessibleDropoffs,
  simplifyPolylinePoints,
} from '../src/services/directionsController.ts';

test('AC-235: Directions controller pulls walking accessibility profile flags', async () => {
  const origin = { lat: 6.9271, lng: 79.8612 };
  const destination = { lat: 6.9312, lng: 79.8655 };

  const directions = await getAccessibilityDirections(origin, destination, {
    wheelchairAccessible: true,
    stepFree: true,
    tactilePavingOnly: false,
    avoidSteepSlopes: true,
  });

  assert.equal(directions.profileFlags.wheelchairAccessible, true);
  assert.equal(directions.profileFlags.stepFree, true);
  assert.ok(directions.polylinePoints.length >= 2);
  assert.ok(directions.steps.length >= 4);
  assert.ok(directions.totalDistanceMeters > 0);
  assert.ok(directions.totalDurationMinutes > 0);
});

test('AC-236: Algorithm returns closest step-free transit drop-offs and parking bays', () => {
  const location = { lat: 6.9271, lng: 79.8612 };
  const dropoffs = findClosestAccessibleDropoffs(location);

  assert.ok(dropoffs.length >= 3);

  const transitDropoff = dropoffs.find((d) => d.type === 'transit_dropoff');
  assert.ok(transitDropoff);
  assert.equal(transitDropoff.hasWheelchairRamp, true);

  const parkingBay = dropoffs.find((d) => d.type === 'accessible_parking_bay');
  assert.ok(parkingBay);
  assert.equal(parkingBay.hasTactilePaving, true);
});

test('AC-237: Network connection drop switches gracefully to offline text fallback', async () => {
  const origin = { lat: 7.2906, lng: 80.6337 };
  const destination = { lat: 7.2945, lng: 80.6389 };

  // Force offline fallback mode
  const directions = await getAccessibilityDirections(
    origin,
    destination,
    { wheelchairAccessible: true, stepFree: true, tactilePavingOnly: false, avoidSteepSlopes: true },
    true // forceOfflineFallback = true
  );

  assert.equal(directions.isOfflineFallback, true);
  assert.ok(directions.steps.length > 0);
  assert.ok(directions.steps[0].instruction);
});

test('AC-238: Polyline point simplification optimizes memory profile footprint', () => {
  const complexPolyline = [
    { lat: 6.92710, lng: 79.86120 },
    { lat: 6.92711, lng: 79.86121 }, // Tiny delta below tolerance threshold
    { lat: 6.92712, lng: 79.86122 },
    { lat: 6.92750, lng: 79.86180 },
    { lat: 6.92800, lng: 79.86250 },
  ];

  const simplified = simplifyPolylinePoints(complexPolyline, 0.0001);

  assert.ok(simplified.length < complexPolyline.length);
  assert.equal(simplified[0], complexPolyline[0]);
  assert.equal(simplified[simplified.length - 1], complexPolyline[complexPolyline.length - 1]);

  // Memory footprint audit check (< 15 KB)
  const footprintKb = (JSON.stringify(simplified).length * 2) / 1024;
  assert.ok(footprintKb < 15, `Polyline memory footprint (${footprintKb.toFixed(2)} KB) must be under 15 KB`);
});

