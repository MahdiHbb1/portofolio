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

  fbm(x: number, y: number, octaves = 5): number {
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

  // Layer 1 (far): radius 55, opacity 0.5
  const farTexture = generateNebulaTexture(1024, 0.003, 5, 0);
  const farGeometry = new THREE.SphereGeometry(55, 32, 32);
  farGeometry.scale(-1, 1, 1);
  const farMaterial = new THREE.MeshBasicMaterial({
    map: new THREE.CanvasTexture(farTexture),
    side: THREE.BackSide,
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const farSphere = new THREE.Mesh(farGeometry, farMaterial);
  spheres.push(farSphere);
  ctx.scene.add(farSphere);

  // Layer 2: radius 48, opacity 0.55
  const layer2Texture = generateNebulaTexture(512, 0.005, 5, 1);
  const layer2Geometry = new THREE.SphereGeometry(48, 32, 32);
  layer2Geometry.scale(-1, 1, 1);
  const layer2Material = new THREE.MeshBasicMaterial({
    map: new THREE.CanvasTexture(layer2Texture),
    side: THREE.BackSide,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const layer2Sphere = new THREE.Mesh(layer2Geometry, layer2Material);
  spheres.push(layer2Sphere);
  ctx.scene.add(layer2Sphere);

  // Layer 3: radius 40, opacity 0.45
  const layer3Texture = generateNebulaTexture(512, 0.006, 5, 1);
  const layer3Geometry = new THREE.SphereGeometry(40, 32, 32);
  layer3Geometry.scale(-1, 1, 1);
  const layer3Material = new THREE.MeshBasicMaterial({
    map: new THREE.CanvasTexture(layer3Texture),
    side: THREE.BackSide,
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const layer3Sphere = new THREE.Mesh(layer3Geometry, layer3Material);
  spheres.push(layer3Sphere);
  ctx.scene.add(layer3Sphere);

  // Layer 4 (new): radius 32, opacity 0.35
  const layer4Texture = generateNebulaTexture(256, 0.008, 5, 2);
  const layer4Geometry = new THREE.SphereGeometry(32, 32, 32);
  layer4Geometry.scale(-1, 1, 1);
  const layer4Material = new THREE.MeshBasicMaterial({
    map: new THREE.CanvasTexture(layer4Texture),
    side: THREE.BackSide,
    transparent: true,
    opacity: 0.35,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const layer4Sphere = new THREE.Mesh(layer4Geometry, layer4Material);
  spheres.push(layer4Sphere);
  ctx.scene.add(layer4Sphere);

  // Layer 5 (new): radius 25, opacity 0.25
  const layer5Texture = generateNebulaTexture(256, 0.01, 5, 2);
  const layer5Geometry = new THREE.SphereGeometry(25, 32, 32);
  layer5Geometry.scale(-1, 1, 1);
  const layer5Material = new THREE.MeshBasicMaterial({
    map: new THREE.CanvasTexture(layer5Texture),
    side: THREE.BackSide,
    transparent: true,
    opacity: 0.25,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const layer5Sphere = new THREE.Mesh(layer5Geometry, layer5Material);
  spheres.push(layer5Sphere);
  ctx.scene.add(layer5Sphere);

  return {
    tick(elapsed: number) {
      spheres[0].rotation.y = elapsed * 0.008 + Math.sin(elapsed * 0.01) * 0.5;
      spheres[0].rotation.x = elapsed * 0.003;
      spheres[1].rotation.y = elapsed * 0.012 + Math.sin(elapsed * 0.015) * 0.5;
      spheres[1].rotation.x = -elapsed * 0.005;
      spheres[2].rotation.y = elapsed * 0.015 + Math.sin(elapsed * 0.012) * 0.5;
      spheres[2].rotation.x = elapsed * 0.007;
      if (spheres[3]) {
        spheres[3].rotation.y = elapsed * 0.018 + Math.sin(elapsed * 0.008) * 0.5;
        spheres[3].rotation.x = -elapsed * 0.006;
      }
      if (spheres[4]) {
        spheres[4].rotation.y = elapsed * 0.02 + Math.sin(elapsed * 0.01) * 0.5;
        spheres[4].rotation.x = elapsed * 0.009;
      }
    },
    dispose() {
      spheres.forEach(sphere => {
        sphere.geometry.dispose();
        const mat = sphere.material as THREE.MeshBasicMaterial;
        if (mat.map) mat.map.dispose();
        mat.dispose();
        ctx.scene.remove(sphere);
      });
    }
  };
}
