import * as THREE from 'three';
import type { SceneContext } from './scene';
import type { PanelHandle } from './panels';

const PANEL_COUNT = 7;
const PARTICLES_PER_LINE = 2;
const TOTAL_PARTICLES = PANEL_COUNT * PARTICLES_PER_LINE;

// Warna aksen tembaga palet 4
const ACCENT = new THREE.Color(0xa07850);

// Bezier quadratic: B(t) = (1-t)²·P0 + 2(1-t)t·P1 + t²·P2
function bezierPoint(
  out: THREE.Vector3,
  p0: THREE.Vector3,
  p1: THREE.Vector3,
  p2: THREE.Vector3,
  t: number,
): void {
  const mt = 1 - t;
  out.set(
    mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x,
    mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y,
    mt * mt * p0.z + 2 * mt * t * p1.z + t * t * p2.z,
  );
}

export interface LineHandle {
  tick: (elapsed: number) => void;
  dispose: () => void;
}

export function createLines(ctx: SceneContext, panels: PanelHandle): LineHandle {
  const { scene } = ctx;

  // --- Garis bezier (satu LineSegments per panel) ---
  // Tiap garis punya CURVE_SEGMENTS segmen — cukup untuk kurva halus
  const CURVE_SEGMENTS = 24;
  const lineGeo = new THREE.BufferGeometry();

  // PANEL_COUNT garis × CURVE_SEGMENTS segmen × 2 titik per segmen
  const linePositions = new Float32Array(PANEL_COUNT * CURVE_SEGMENTS * 2 * 3);
  lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));

  const lineMat = new THREE.LineBasicMaterial({
    color: ACCENT,
    transparent: true,
    opacity: 0.42,
    depthWrite: false,
  });

  const lineSegments = new THREE.LineSegments(lineGeo, lineMat);
  scene.add(lineSegments);

  // --- Partikel (InstancedMesh) ---
  const particleGeo = new THREE.SphereGeometry(0.022, 4, 4);
  const particleMat = new THREE.MeshBasicMaterial({
    color: ACCENT,
    transparent: true,
    opacity: 0.65,
    depthWrite: false,
  });
  const particles = new THREE.InstancedMesh(particleGeo, particleMat, TOTAL_PARTICLES);
  particles.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  scene.add(particles);

  // Fase awal tiap partikel — offset biar tidak semua mulai di posisi sama
  const phases = Array.from({ length: TOTAL_PARTICLES }, (_, i) =>
    (i % PARTICLES_PER_LINE) / PARTICLES_PER_LINE,
  );

  // Reusable vectors
  const origin = new THREE.Vector3(0, 0, 0); // blob selalu di pusat
  const cp = new THREE.Vector3();             // control point bezier
  const pt = new THREE.Vector3();             // titik pada kurva
  const dummy = new THREE.Object3D();

  function buildControlPoint(
    panelPos: THREE.Vector3,
    elapsed: number,
    panelIdx: number,
  ): void {
    // Midpoint panel→origin, digeser sedikit pakai sin/cos berbasis waktu
    // Tiap panel punya fase berbeda biar gerak CP tidak sinkron
    const phase = (panelIdx / PANEL_COUNT) * Math.PI * 2;
    const drift = 0.18;
    cp.set(
      (panelPos.x * 0.5) + Math.sin(elapsed * 0.22 + phase) * drift,
      (panelPos.y * 0.5) + Math.cos(elapsed * 0.17 + phase) * drift,
      (panelPos.z * 0.5) + Math.sin(elapsed * 0.19 + phase + 1.1) * drift,
    );
  }

  function tick(elapsed: number) {
    const posAttr = lineGeo.getAttribute('position') as THREE.BufferAttribute;

    for (let pi = 0; pi < PANEL_COUNT; pi++) {
      const panelPos = panels.meshes[pi].position;
      buildControlPoint(panelPos, elapsed, pi);

      // Isi posisi segmen garis untuk panel ini
      const baseIdx = pi * CURVE_SEGMENTS * 2;
      for (let s = 0; s < CURVE_SEGMENTS; s++) {
        const t0 = s / CURVE_SEGMENTS;
        const t1 = (s + 1) / CURVE_SEGMENTS;

        bezierPoint(pt, panelPos, cp, origin, t0);
        posAttr.setXYZ(baseIdx + s * 2,     pt.x, pt.y, pt.z);

        bezierPoint(pt, panelPos, cp, origin, t1);
        posAttr.setXYZ(baseIdx + s * 2 + 1, pt.x, pt.y, pt.z);
      }

      // Partikel: bergerak dari panel (t=0) menuju blob (t=1)
      for (let k = 0; k < PARTICLES_PER_LINE; k++) {
        const pIdx = pi * PARTICLES_PER_LINE + k;
        // t bergerak 0→1 terus menerus, kecepatan sedikit berbeda per panel
        const speed = 0.18 + pi * 0.008;
        const t = (phases[pIdx] + elapsed * speed) % 1.0;

        bezierPoint(pt, panelPos, cp, origin, t);
        dummy.position.copy(pt);
        dummy.updateMatrix();
        particles.setMatrixAt(pIdx, dummy.matrix);
      }
    }

    posAttr.needsUpdate = true;
    particles.instanceMatrix.needsUpdate = true;
  }

  function dispose() {
    scene.remove(lineSegments);
    scene.remove(particles);
    lineGeo.dispose();
    lineMat.dispose();
    particleGeo.dispose();
    particleMat.dispose();
  }

  return { tick, dispose };
}
