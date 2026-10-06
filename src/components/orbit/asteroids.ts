import * as THREE from 'three';
import type { SceneContext } from './scene';

export interface AsteroidsHandle {
  tick: (elapsed: number) => void;
  dispose: () => void;
}

interface Asteroid {
  mesh: THREE.Mesh;
  orbitRadius: number;
  orbitSpeed: number;
  orbitAngle: number;
  rotationSpeed: THREE.Vector3;
  inclination: number;
}

export function createAsteroids(ctx: SceneContext): AsteroidsHandle {
  const { scene } = ctx;
  const asteroids: Asteroid[] = [];

  const sizes = [
    { scale: 0.3, count: 12 },
    { scale: 0.6, count: 10 },
    { scale: 1.2, count: 3 },
  ];

  const materials = [
    new THREE.MeshStandardMaterial({ 
      color: 0xf0f0f0, 
      roughness: 0.7, 
      metalness: 0.3,
      emissive: 0x505050,
      emissiveIntensity: 0.2
    }),
    new THREE.MeshStandardMaterial({ 
      color: 0xe0e0e0, 
      roughness: 0.75, 
      metalness: 0.25,
      emissive: 0x404040,
      emissiveIntensity: 0.15
    }),
    new THREE.MeshStandardMaterial({ 
      color: 0xc0c0c0, 
      roughness: 0.8, 
      metalness: 0.2,
      emissive: 0x303030,
      emissiveIntensity: 0.1
    }),
  ];

  sizes.forEach((sizeConfig, sizeIndex) => {
    for (let i = 0; i < sizeConfig.count; i++) {
      const geometry = new THREE.IcosahedronGeometry(sizeConfig.scale, 1);
      
      const posArray = geometry.attributes.position.array as Float32Array;
      for (let j = 0; j < posArray.length; j += 3) {
        const noise = (Math.random() - 0.5) * 0.15 * sizeConfig.scale;
        posArray[j] += noise;
        posArray[j + 1] += noise;
        posArray[j + 2] += noise;
      }
      geometry.attributes.position.needsUpdate = true;
      geometry.computeVertexNormals();

      const material = materials[sizeIndex % materials.length];
      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      const orbitRadius = 15 + Math.random() * 25;
      const orbitSpeed = (0.02 + Math.random() * 0.03) * (Math.random() > 0.5 ? 1 : -1);
      const orbitAngle = Math.random() * Math.PI * 2;
      const inclination = (Math.random() - 0.5) * (Math.PI / 6);

      const rotationSpeed = new THREE.Vector3(
        (Math.random() - 0.5) * 0.003,
        (Math.random() - 0.5) * 0.003,
        (Math.random() - 0.5) * 0.003
      );

      asteroids.push({
        mesh,
        orbitRadius,
        orbitSpeed,
        orbitAngle,
        rotationSpeed,
        inclination,
      });

      scene.add(mesh);
    }
  });

  function tick(elapsed: number) {
    asteroids.forEach((asteroid) => {
      asteroid.orbitAngle += asteroid.orbitSpeed * 0.01;

      const x = Math.cos(asteroid.orbitAngle) * asteroid.orbitRadius;
      const z = Math.sin(asteroid.orbitAngle) * asteroid.orbitRadius;
      const y = Math.sin(asteroid.orbitAngle) * asteroid.inclination * asteroid.orbitRadius * 0.3;

      asteroid.mesh.position.set(x, y, z);

      asteroid.mesh.rotation.x += asteroid.rotationSpeed.x;
      asteroid.mesh.rotation.y += asteroid.rotationSpeed.y;
      asteroid.mesh.rotation.z += asteroid.rotationSpeed.z;
    });
  }

  function dispose() {
    asteroids.forEach((asteroid) => {
      scene.remove(asteroid.mesh);
      asteroid.mesh.geometry.dispose();
    });
    materials.forEach((mat) => mat.dispose());
  }

  return { tick, dispose };
}
