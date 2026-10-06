import * as THREE from 'three';
import type { SceneContext } from './scene';

// Classic Perlin noise helpers (GLSL) — domain 3D, output [-1, 1]
// Sumber: Stefan Gustavson "Simplex noise demystified" (implementasi mod289 standar)
const NOISE_GLSL = /* glsl */`
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  i = mod289(i);
  vec4 p = permute(permute(permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}
`;

const vertexShader = /* glsl */`
${NOISE_GLSL}

uniform float uTime;
uniform float uStrength;

void main() {
  // 5-octave FBM noise for organic deformation
  vec3 pos = position;
  float n1 = snoise(pos * 1.2 + uTime * 0.18);        // Octave 1: base shape
  float n2 = snoise(pos * 2.5 - uTime * 0.11) * 0.4;  // Octave 2: mid detail
  float n3 = snoise(pos * 5.0 + uTime * 0.25) * 0.15; // Octave 3: fine detail
  float n4 = snoise(pos * 10.0 + uTime * 0.08) * 0.08; // Octave 4: micro detail
  float n5 = snoise(pos * 20.0 - uTime * 0.05) * 0.04; // Octave 5: texture
  float displacement = (n1 + n2 + n3 + n4 + n5) * uStrength;

  vec3 displaced = pos + normal * displacement;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
}
`;

const fragmentShaderWire = /* glsl */`
uniform vec3 uColor;
uniform float uOpacity;

void main() {
  gl_FragColor = vec4(uColor, uOpacity);
}
`;

const fragmentShaderGlow = /* glsl */`
void main() {
  // Sphere solid hampir transparan — hanya rim yang terasa
  gl_FragColor = vec4(0.627, 0.471, 0.314, 0.04); // #a07850 @ 4%
}
`;

export interface BlobHandle {
  tick: (elapsed: number) => void;
  dispose: () => void;
}

interface EnergyParticle {
  mesh: THREE.Points;
  angle: number;
  elevation: number;
  radius: number;
  speed: number;
  life: number;
  maxLife: number;
}

export function createBlob(ctx: SceneContext): BlobHandle {
  const { scene } = ctx;

  const geometry = new THREE.IcosahedronGeometry(1.15, 6);

  // --- Wireframe ---
  const wireMaterial = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader: fragmentShaderWire,
      uniforms: {
        uTime:     { value: 0 },
        uStrength: { value: 0.48 },
        uColor:    { value: new THREE.Color(0xa07850) },
        uOpacity:  { value: 0.18 },
      },
    wireframe: true,
    transparent: true,
    depthWrite: false,
  });

  const wireMesh = new THREE.Mesh(geometry, wireMaterial);
  scene.add(wireMesh);

  // --- Glow sphere solid di balik wireframe ---
  const glowGeo = new THREE.IcosahedronGeometry(1.15, 6);
  const glowMaterial = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader: fragmentShaderGlow,
      uniforms: {
        uTime:     { value: 0 },
        uStrength: { value: 0.48 },
      },
    transparent: true,
    depthWrite: false,
    side: THREE.BackSide,
  });

  const glowMesh = new THREE.Mesh(glowGeo, glowMaterial);
  scene.add(glowMesh);

  // --- Outer glow layer ---
  const outerGeo = new THREE.IcosahedronGeometry(1.35, 4);
  const outerMaterial = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader: /* glsl */`
      void main() {
        gl_FragColor = vec4(0.627, 0.471, 0.314, 0.02);
      }
    `,
    uniforms: {
      uTime: { value: 0 },
      uStrength: { value: 0.25 },
    },
    transparent: true,
    depthWrite: false,
    side: THREE.BackSide,
  });
  const outerMesh = new THREE.Mesh(outerGeo, outerMaterial);
  scene.add(outerMesh);

  // --- 80 energy particles ---
  const particles: EnergyParticle[] = [];
  for (let i = 0; i < 80; i++) {
    const particleGeo = new THREE.BufferGeometry();
    const position = new Float32Array(3);
    particleGeo.setAttribute('position', new THREE.BufferAttribute(position, 3));

    const size = 0.02 + Math.random() * 0.02;
    const particleMat = new THREE.PointsMaterial({
      size,
      color: 0xa07850,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const mesh = new THREE.Points(particleGeo, particleMat);
    scene.add(mesh);

    particles.push({
      mesh,
      angle: Math.random() * Math.PI * 2,
      elevation: (Math.random() - 0.5) * Math.PI,
      radius: 2.5 + Math.random() * 0.3,
      speed: 0.01 + Math.random() * 0.02,
      life: 0,
      maxLife: 3,
    });
  }

  function tick(elapsed: number) {
    const pulseScale = 0.95 + Math.sin(elapsed * 0.5) * 0.1;
    
    wireMaterial.uniforms.uTime.value = elapsed;
    wireMesh.scale.setScalar(pulseScale);
    
    glowMaterial.uniforms.uTime.value = elapsed;
    glowMesh.scale.setScalar(pulseScale);
    
    outerMaterial.uniforms.uTime.value = elapsed;
    outerMesh.scale.setScalar(pulseScale * 1.05);

    particles.forEach((p) => {
      p.life += 0.016;
      if (p.life > p.maxLife) {
        p.life = 0;
        p.angle = Math.random() * Math.PI * 2;
        p.elevation = (Math.random() - 0.5) * Math.PI;
        p.radius = 2.5 + Math.random() * 0.3;
      }

      p.radius -= p.speed;
      
      const x = Math.cos(p.angle) * Math.cos(p.elevation) * p.radius;
      const y = Math.sin(p.elevation) * p.radius;
      const z = Math.sin(p.angle) * Math.cos(p.elevation) * p.radius;

      const posArray = p.mesh.geometry.attributes.position.array as Float32Array;
      posArray[0] = x;
      posArray[1] = y;
      posArray[2] = z;
      p.mesh.geometry.attributes.position.needsUpdate = true;

      const mat = p.mesh.material as THREE.PointsMaterial;
      mat.opacity = Math.max(0, 0.8 * (1 - p.life / p.maxLife));
    });
  }

  function dispose() {
    scene.remove(wireMesh);
    scene.remove(glowMesh);
    scene.remove(outerMesh);
    geometry.dispose();
    glowGeo.dispose();
    outerGeo.dispose();
    wireMaterial.dispose();
    glowMaterial.dispose();
    outerMaterial.dispose();
    particles.forEach((p) => {
      scene.remove(p.mesh);
      p.mesh.geometry.dispose();
      (p.mesh.material as THREE.Material).dispose();
    });
  }

  return { tick, dispose };
}
