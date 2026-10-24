import test from 'node:test';
import assert from 'node:assert/strict';
import { latLonToCartesian } from './globeProceduralTextures';

test('latLonToCartesian correctly computes 3D coordinates on sphere', () => {
  // North pole (lat=90) should be at y=1, x=0, z=0
  const northPole = latLonToCartesian(90, 0, 1.0);
  assert.ok(Math.abs(northPole.y - 1.0) < 0.001);
  assert.ok(Math.abs(northPole.x) < 0.001);
  assert.ok(Math.abs(northPole.z) < 0.001);

  // South pole (lat=-90) should be at y=-1, x=0, z=0
  const southPole = latLonToCartesian(-90, 0, 1.0);
  assert.ok(Math.abs(southPole.y - (-1.0)) < 0.001);

  // Equator at lon=0
  const equatorPrime = latLonToCartesian(0, 0, 1.0);
  assert.ok(Math.abs(equatorPrime.y) < 0.001);
  // Radius magnitude check
  const mag = Math.sqrt(
    equatorPrime.x * equatorPrime.x +
    equatorPrime.y * equatorPrime.y +
    equatorPrime.z * equatorPrime.z
  );
  assert.ok(Math.abs(mag - 1.0) < 0.001);
});
