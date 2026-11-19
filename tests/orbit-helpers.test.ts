import test from 'node:test';
import assert from 'node:assert/strict';
import { projects } from '../src/data/projects.ts';
import { wrapCardText, buildCardModel, ORBIT_LAYER_SPECS } from '../src/components/orbit/card-layout.ts';
import { computePanelCameraTarget } from '../src/components/orbit/camera-math.ts';

test('wrapCardText wraps at word boundaries and truncates overflow with ellipsis', () => {
  const lines = wrapCardText('Sistem monitoring berbasis ML untuk program makan bergizi gratis nasional.', 28, 2);
  assert.equal(lines.length, 2);
  assert.ok(lines[0].length <= 28);
  assert.ok(lines[1].endsWith('…'));
});

test('wrapCardText handles empty string and single long token safely', () => {
  assert.deepEqual(wrapCardText('   ', 20, 3), []);
  const hard = wrapCardText('supercalifragilisticexpialidocious', 12, 2);
  assert.ok(hard.length <= 2 && hard[0].length <= 12);
});

test('buildCardModel builds localized card content with max 3 descLines and max 3 tags', () => {
  const sigap = projects.find((p) => p.id === 'sigap-mbg')!;
  const modelId = buildCardModel(sigap, 'id');
  const modelEn = buildCardModel(sigap, 'en');
  assert.equal(modelId.title, 'SIGAP MBG');
  assert.equal(modelId.featured, true);
  assert.ok(modelId.descLines.length >= 1 && modelId.descLines.length <= 3);
  assert.ok(modelId.tags.length <= 3);
  assert.notEqual(modelId.descLines.join(' '), modelEn.descLines.join(' '));
});

test('ORBIT_LAYER_SPECS covers all 7 project IDs exactly once', () => {
  const ids = ORBIT_LAYER_SPECS.flatMap((layer) => layer.projectIds);
  assert.equal(ids.length, 7);
  assert.deepEqual(new Set(ids), new Set(projects.map((p) => p.id)));
});

test('computePanelCameraTarget places camera on camera-facing side of panel', () => {
  const target = computePanelCameraTarget({ x: 0, y: 0, z: 7 }, { x: 0, y: 0, z: 3.6 }, 2.4);
  assert.ok(Math.abs(target.z - 6.0) < 1e-6);
  assert.ok(target.z > 3.6, 'camera should stay in front of panel, not swing through origin');
});

test('computePanelCameraTarget falls back cleanly when cameraPos equals panelPos', () => {
  const target = computePanelCameraTarget({ x: 2, y: 1, z: 3 }, { x: 2, y: 1, z: 3 }, 2.4);
  assert.ok(Math.abs(target.z - 5.4) < 1e-6);
});
