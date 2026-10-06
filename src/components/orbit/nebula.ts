import * as THREE from 'three';
import type { SceneContext } from './scene';

// Perlin noise implementation for organic cloud patterns
class PerlinNoise {
  private permutation: number[] = [];

  constructor() {
    for (let i = 0; i < 256; i++) {
      this.permutation[i] = i;
    }
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.permutation[i], this.permutation[j]] = [this.permutation[j], this.permutation[i]];
    }
    this.permutation = [...this.permutation, ...this.permutation];
  }

  fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  lerp(t: number, a: number, b: number): number {
    return a + t * (b - a);
  }

  grad(hash: number, x: number, y: number): number {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : 0;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  noise(x: number, y: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    x -= Math.floor(x);
    y -= Math.floor(y);
    const u = this.fade(x);
    const v = this.fade(y);
    const a = this.permutation[X] + Y;
    const aa = this.permutation[a];
    const ab = this.permutation[a + 1];
    const b = this.permutation[X + 1] + Y;
    const ba = this.permutation[b];
    const bb = this.permutation[b + 1];
    return this.lerp(
      v,
      this.lerp(u, this.grad(this.permutation[aa], x, y), this.grad(this.permutation[ba], x - 1, y)),
      this.lerp(u, this.grad(this.permutation[ab], x, y - 1), this.grad(this.permutation[bb], x - 1, y - 1))
    );
  }

  fbm(x: number, y: number, octaves = 4): number {
    let value = 0;
    let amplitude = 1;
    let frequency = 1;
    let maxValue = 0;
    for (let i = 0; i < octaves; i++) {
      value += this.noise(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= 0.5;
      frequency *= 2;
    }
    return value / maxValue;
  }
}

/**
 * Generate spherical nebula texture with improved color balance
 * Purpose (R-07): Volumetric space atmosphere for sci-fi portfolio
 * Colors (R-01): Brown brand accent woven into purple/blue gradient
 */
function generateNebulaTexture(size: number, noiseScale: number, octaves: number, colorVariant: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const perlin = new PerlinNoise();
  const imageData = ctx.createImageData(size, size);
  const data = imageData.data;

  const centerX = size / 2;
  const centerY = size / 2;
  const maxRadius = size * 0.6;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;

      const dx = x - centerX;
      const dy = y - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const radialFalloff = Math.max(0, 1 - (distance / maxRadius) * 1.2);

      const noiseValue = (perlin.fbm(x * noiseScale, y * noiseScale, octaves) + 1) * 0.5;
      const finalValue = noiseValue * radialFalloff;

      let r: number, g: number, b: number;

      // Color variant determines layer character
      if (colorVariant === 0) {
        // Far layer: Deep purple/blue with brown hints
        if (finalValue < 0.3) {
          const t = finalValue / 0.3;
          r = Math.floor(15 + t * 20);
          g = Math.floor(10 + t * 15);
          b = Math.floor(25 + t * 30);
        } else if (finalValue < 0.6) {
          const t = (finalValue - 0.3) / 0.3;
          r = Math.floor(35 + t * 50);
          g = Math.floor(25 + t * 30);
          b = Math.floor(55 + t * 25);
        } else {
          const t = (finalValue - 0.6) / 0.4;
          r = Math.floor(85 + t * 40);
          g = Math.floor(55 + t * 30);
          b = Math.floor(80 + t * 20);
        }
      } else if (colorVariant === 1) {
        // Mid layer: Brown/purple blend
        if (finalValue < 0.4) {
          const t = finalValue / 0.4;
          r = Math.floor(40 + t * 60);
          g = Math.floor(30 + t * 50);
          b = Math.floor(45 + t * 35);
        } else {
          const t = (finalValue - 0.4) / 0.6;
          r = Math.floor(100 + t * 60);
          g = Math.floor(80 + t * 40);
          b = Math.floor(80 + t * 20);
        }
      } else {
        // Near layer: Brown dominant with wisps
        if (finalValue < 0.5) {
          const t = finalValue / 0.5;
          r = Math.floor(80 + t * 50);
          g = Math.floor(60 + t * 40);
          b = Math.floor(50 + t * 30);
        } else {
          const t = (finalValue - 0.5) / 0.5;
          r = Math.floor(130 + t * 30);
          g = Math.floor(100 + t * 20);
          b = Math.floor(80 + t * 10);
        }
      }

      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = Math.floor(finalValue * 255 * 0.85); // Slightly transparent
    }
  }

  ctx.putImageData(imageData, 0, 0);
  ctx.filter = 'blur(3px)';
  ctx.drawImage(canvas, 0, 0);

  return canvas;
}

/**
 * Create spherical nebula skybox system
 * Inside-out spheres guarantee 360° visibility
 * No camera-follow needed - camera always inside
 */
export function createNebulae(ctx: SceneContext) {
  const spheres: THREE.Mesh[] = [];

  // Far sphere: Subtle deep space backdrop
  const farTexture = generateNebulaTexture(1024, 0.003, 4, 0);
  const farGeometry = new THREE.SphereGeometry(55, 32, 32);
  farGeometry.scale(-1, 1, 1); // Flip normals - see inside
  const farMaterial = new THREE.MeshBasicMaterial({
    map: new THREE.CanvasTexture(farTexture),
    side: THREE.BackSide,
    transparent: true,
    opacity: 0.35,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const farSphere = new THREE.Mesh(farGeometry, farMaterial);
  spheres.push(farSphere);
  ctx.scene.add(farSphere);

  // Mid sphere: Brown/purple nebula patches
  const midTexture = generateNebulaTexture(512, 0.005, 3, 1);
  const midGeometry = new THREE.SphereGeometry(45, 32, 32);
  midGeometry.scale(-1, 1, 1);
  const midMaterial = new THREE.MeshBasicMaterial({
    map: new THREE.CanvasTexture(midTexture),
    side: THREE.BackSide,
    transparent: true,
    opacity: 0.4,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const midSphere = new THREE.Mesh(midGeometry, midMaterial);
  spheres.push(midSphere);
  ctx.scene.add(midSphere);

  // Near sphere: Brown wispy details
  const nearTexture = generateNebulaTexture(256, 0.008, 2, 2);
  const nearGeometry = new THREE.SphereGeometry(35, 32, 32);
  nearGeometry.scale(-1, 1, 1);
  const nearMaterial = new THREE.MeshBasicMaterial({
    map: new THREE.CanvasTexture(nearTexture),
    side: THREE.BackSide,
    transparent: true,
    opacity: 0.25,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const nearSphere = new THREE.Mesh(nearGeometry, nearMaterial);
  spheres.push(nearSphere);
  ctx.scene.add(nearSphere);

  return {
    tick(elapsed: number) {
      // Slow rotation for organic movement (no camera follow needed)
      spheres[0].rotation.y = elapsed * 0.008;
      spheres[0].rotation.x = elapsed * 0.003;
      spheres[1].rotation.y = elapsed * 0.012;
      spheres[1].rotation.x = -elapsed * 0.005;
      spheres[2].rotation.y = elapsed * 0.015;
      spheres[2].rotation.x = elapsed * 0.007;
    },
    dispose() {
      spheres.forEach(sphere => {
        sphere.geometry.dispose();
        const mat = sphere.material as THREE.MeshBasicMaterial;
        mat.map?.dispose();
        mat.dispose();
        ctx.scene.remove(sphere);
      });
    },
  };
}
