import * as THREE from 'three';
import type { SceneContext } from './scene';

/**
 * Create enhanced starfield with twinkle animation
 * Purpose (R-19): Twinkle creates living space atmosphere
 * Size increased 3-5x for visibility, opacity boosted
 * Color distribution: Brown brand accent woven throughout
 */
export function createStarfield(ctx: SceneContext) {
  const count = 6000;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const colors = new Float32Array(count * 3);
  const twinklePhase = new Float32Array(count);
  const twinkleSpeed = new Float32Array(count);
  const baseOpacity = new Float32Array(count);

  // Color palette — warm brown earth-tone (DESIGN.md compliant)
  const warmWhite = new THREE.Color(0xe8e0d4);   // Primary text
  const brownTint = new THREE.Color(0xb89070);   // Secondary accent
  const creamBrown = new THREE.Color(0xd0b090);  // Tertiary accent
  const brandBrown = new THREE.Color(0xa07850);  // Primary accent

  for (let i = 0; i < count; i++) {
    // Distribute stars in deep sphere (radius 20-55)
    const radius = 20 + Math.random() * 35;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = radius * Math.cos(phi);

    // INCREASED size distribution (3-5x bigger for visibility)
    const sizeRoll = Math.random();
    if (sizeRoll < 0.5) {
      sizes[i] = Math.random() * 0.08 + 0.08; // Tiny: 0.08-0.16 (was 0.02-0.04)
    } else if (sizeRoll < 0.85) {
      sizes[i] = Math.random() * 0.12 + 0.16; // Small: 0.16-0.28 (was 0.04-0.08)
    } else if (sizeRoll < 0.97) {
      sizes[i] = Math.random() * 0.16 + 0.28; // Medium: 0.28-0.44 (was 0.08-0.12)
    } else {
      sizes[i] = Math.random() * 0.24 + 0.44; // Large: 0.44-0.68 (was 0.12-0.18)
    }

    // Color distribution — warm brown-tinted starfield
    const colorChoice = Math.random();
    let starColor: THREE.Color;
    if (colorChoice < 0.45) {
      starColor = warmWhite;      // 45% warm white (primary)
    } else if (colorChoice < 0.75) {
      starColor = creamBrown;      // 30% cream brown (subtle)
    } else if (colorChoice < 0.92) {
      starColor = brownTint;       // 17% light brown tint
    } else {
      starColor = brandBrown;      // 8% brand accent brown
    }

    colors[i * 3] = starColor.r;
    colors[i * 3 + 1] = starColor.g;
    colors[i * 3 + 2] = starColor.b;

    // Twinkle animation attributes
    twinklePhase[i] = Math.random() * Math.PI * 2;
    twinkleSpeed[i] = 0.3 + Math.random() * 1.2; // Slightly slower twinkle
    baseOpacity[i] = 0.7 + Math.random() * 0.3; // INCREASED from 0.5-1.0 to 0.7-1.0
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('twinklePhase', new THREE.BufferAttribute(twinklePhase, 1));
  geometry.setAttribute('twinkleSpeed', new THREE.BufferAttribute(twinkleSpeed, 1));
  geometry.setAttribute('baseOpacity', new THREE.BufferAttribute(baseOpacity, 1));

  // Custom shader for GPU-based twinkle animation
  const vertexShader = /* glsl */`
    attribute float size;
    attribute float twinklePhase;
    attribute float twinkleSpeed;
    attribute float baseOpacity;
    uniform float uTime;
    varying float vOpacity;
    varying vec3 vColor;
    
    void main() {
      vColor = color;
      
      // Sine-based twinkle animation with stronger variation
      float twinkle = sin(uTime * twinkleSpeed + twinklePhase) * 0.5 + 0.5;
      vOpacity = baseOpacity * (0.4 + twinkle * 0.6); // Range 0.4-1.0
      
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = size * (300.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
    }
  `;

  const fragmentShader = /* glsl */`
    varying float vOpacity;
    varying vec3 vColor;
    
    void main() {
      // Circular point shape with soft edges
      vec2 center = gl_PointCoord - 0.5;
      float dist = length(center);
      if (dist > 0.5) discard;
      
      // Softer falloff for more visible glow
      float alpha = (1.0 - dist * 1.8) * vOpacity;
      gl_FragColor = vec4(vColor, alpha);
    }
  `;

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
    },
    vertexShader,
    fragmentShader,
    transparent: true,
    vertexColors: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const points = new THREE.Points(geometry, material);
  ctx.scene.add(points);

  return {
    tick(elapsed: number) {
      // No camera follow needed - stars already in sphere around origin
      material.uniforms.uTime.value = elapsed;
    },
    dispose() {
      geometry.dispose();
      material.dispose();
      ctx.scene.remove(points);
    },
  };
}
