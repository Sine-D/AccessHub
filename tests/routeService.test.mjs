import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateAccessibleRoute } from '../src/services/routeService.ts';

test('AC-230: Calculate Step-Free Wheelchair Route Preview', () => {
  const dummyPlace = {
    id: 'p-kandy-101',
    title: 'Kandy City Center Shopping Mall',
    address: 'Dalada Veediya, Kandy',
    type: 'place',
    distance: '0.4 km',
    lat: 7.2906,
    lng: 80.6337,
    image: 'https://images.unsplash.com/photo-1544816155-12df9643f363',
    accessibilityFeatures: ['Step-free campus', 'Elevator', 'Tactile paving'],
  };

  const result = calculateAccessibleRoute(dummyPlace, 'step_free_wheelchair');

  assert.equal(result.routeType, 'step_free_wheelchair');
  assert.equal(result.summary.stepFreeScorePercentage, 100);
  assert.ok(result.summary.totalDistanceMeters > 0);
  assert.ok(result.steps.length >= 4);

  // Validate step properties
  const rampStep = result.steps.find((s) => s.hasRamp);
  assert.ok(rampStep, 'Step-free route should contain ramp step');
  assert.ok(rampStep.slopeGradientPercent !== undefined);

  const elevatorStep = result.steps.find((s) => s.hasElevator);
  assert.ok(elevatorStep, 'Step-free route should contain elevator step');
});

test('AC-230: Calculate Tactile & Audio Route Preview', () => {
  const dummyPlace = {
    id: 'p-galle-102',
    title: 'Galle Fort Heritage Center',
    address: 'Church Street, Galle Fort',
    type: 'place',
    distance: '0.2 km',
    lat: 6.0329,
    lng: 80.2168,
    image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982',
    accessibilityFeatures: ['Tactile paving', 'Braille menu'],
  };

  const result = calculateAccessibleRoute(dummyPlace, 'tactile_paving_audio');

  assert.equal(result.routeType, 'tactile_paving_audio');
  assert.equal(result.summary.tactileCoveragePercentage, 100);
  assert.ok(result.steps.length >= 4);

  // Validate tactile surface indicators and audio cues
  const tactileStep = result.steps.find((s) => s.hasTactilePaving);
  assert.ok(tactileStep, 'Tactile route should contain tactile paving step');
  assert.ok(tactileStep.tactileSurfaceType);
  assert.ok(tactileStep.audioCueText);
});
