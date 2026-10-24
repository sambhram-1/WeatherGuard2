import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateBatteryStatus, formatConnectionLabel } from './deviceHealth';

test('evaluateBatteryStatus identifies normal, low and critical battery thresholds', () => {
  const normal = evaluateBatteryStatus(85, false);
  assert.equal(normal.isLowBattery, false);
  assert.equal(normal.isCriticalBattery, false);
  assert.ok(normal.estimatedRuntimeMinutes > 300);

  const low = evaluateBatteryStatus(22, false);
  assert.equal(low.isLowBattery, true);
  assert.equal(low.isCriticalBattery, false);

  const critical = evaluateBatteryStatus(12, false);
  assert.equal(critical.isLowBattery, true);
  assert.equal(critical.isCriticalBattery, true);

  // If charging, low battery warning is suppressed
  const charging = evaluateBatteryStatus(10, true);
  assert.equal(charging.isLowBattery, false);
  assert.equal(charging.isCriticalBattery, false);
});

test('formatConnectionLabel correctly handles offline and cellular types', () => {
  assert.equal(formatConnectionLabel(false), 'Offline');
  assert.equal(formatConnectionLabel(true, '4g'), '5G');
  assert.equal(formatConnectionLabel(true, '3g'), '3G');
  assert.equal(formatConnectionLabel(true), '4G');
});
