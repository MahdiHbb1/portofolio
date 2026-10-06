import * as THREE from 'three';
import type { SceneContext } from './scene';

export interface AsteroidsHandle {
  tick: (elapsed: number) => void;
  dispose: () => void;
}

interface Asteroid {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  rotationSpeed: THREE.Vector3;
  radius: number;
  collisionFlash: number;
}

export function createAsteroids(ctx: SceneContext): AsteroidsHandle {
  const { scene } = ctx;
  const asteroids: Asteroid[] = [];

  const sizes = [
    { scale: 0.3, count: 20 },
    { scale: 0.6, count: 16 },
    { scale: 1.2, count: 6 },
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

      const material = materials[sizeIndex % materials.length].clone();
      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      const spawnRadius = 10 + Math.random() * 30;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      mesh.position.set(
        spawnRadius * Math.sin(phi) * Math.cos(theta),
        spawnRadius * Math.sin(phi) * Math.sin(theta),
        spawnRadius * Math.cos(phi)
      );

      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.12,
        (Math.random() - 0.5) * 0.12,
        (Math.random() - 0.5) * 0.12
      );

      const rotationSpeed = new THREE.Vector3(
        (Math.random() - 0.5) * 0.003,
        (Math.random() - 0.5) * 0.003,
        (Math.random() - 0.5) * 0.003
      );

      asteroids.push({
        mesh,
        velocity,
        rotationSpeed,
        radius: sizeConfig.scale,
        collisionFlash: 0,
      });

      scene.add(mesh);
    }
  });

  function tick(elapsed: number) {
    const boundary = 45;
    
    asteroids.forEach((asteroid) => {
      asteroid.mesh.position.add(asteroid.velocity);

      if (Math.abs(asteroid.mesh.position.x) > boundary) {
        asteroid.mesh.position.x = -Math.sign(asteroid.mesh.position.x) * boundary;
      }
      if (Math.abs(asteroid.mesh.position.y) > boundary) {
        asteroid.mesh.position.y = -Math.sign(asteroid.mesh.position.y) * boundary;
      }
      if (Math.abs(asteroid.mesh.position.z) > boundary) {
        asteroid.mesh.position.z = -Math.sign(asteroid.mesh.position.z) * boundary;
      }

      asteroid.mesh.rotation.x += asteroid.rotationSpeed.x;
      asteroid.mesh.rotation.y += asteroid.rotationSpeed.y;
      asteroid.mesh.rotation.z += asteroid.rotationSpeed.z;

      if (asteroid.collisionFlash > 0) {
        asteroid.collisionFlash -= 0.016;
        const material = asteroid.mesh.material as THREE.MeshStandardMaterial;
        const baseIntensity = material.emissive.equals(new THREE.Color(0x505050)) ? 0.2 : 
                              material.emissive.equals(new THREE.Color(0x404040)) ? 0.15 : 0.1;
        material.emissiveIntensity = baseIntensity + (asteroid.collisionFlash * 2);
      }
    });

    for (let i = 0; i < asteroids.length; i++) {
      for (let j = i + 1; j < asteroids.length; j++) {
        const a = asteroids[i];
        const b = asteroids[j];
        
        const dx = b.mesh.position.x - a.mesh.position.x;
        const dy = b.mesh.position.y - a.mesh.position.y;
        const dz = b.mesh.position.z - a.mesh.position.z;
        const distanceSq = dx * dx + dy * dy + dz * dz;
        const minDist = a.radius + b.radius;
        
        if (distanceSq < minDist * minDist && distanceSq > 0.001) {
          const distance = Math.sqrt(distanceSq);
          const nx = dx / distance;
          const ny = dy / distance;
          const nz = dz / distance;
          
          const dvx = a.velocity.x - b.velocity.x;
          const dvy = a.velocity.y - b.velocity.y;
          const dvz = a.velocity.z - b.velocity.z;
          
          const velocityAlongNormal = dvx * nx + dvy * ny + dvz * nz;
          
          if (velocityAlongNormal > 0) {
            const restitution = 0.8;
            const impulse = (1 + restitution) * velocityAlongNormal;
            
            a.velocity.x -= impulse * nx;
            a.velocity.y -= impulse * ny;
            a.velocity.z -= impulse * nz;
            
            b.velocity.x += impulse * nx;
            b.velocity.y += impulse * ny;
            b.velocity.z += impulse * nz;
            
            const overlap = minDist - distance;
            const separationDist = overlap * 0.55;
            
            a.mesh.position.x -= nx * separationDist;
            a.mesh.position.y -= ny * separationDist;
            a.mesh.position.z -= nz * separationDist;
            
            b.mesh.position.x += nx * separationDist;
            b.mesh.position.y += ny * separationDist;
            b.mesh.position.z += nz * separationDist;
            
            a.collisionFlash = 0.3;
            b.collisionFlash = 0.3;
          }
        }
      }
    }
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
