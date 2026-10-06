import * as THREE from 'three';
import type { SceneContext } from './scene';

export interface ShootingStarsHandle {
  tick: (elapsed: number) => void;
  dispose: () => void;
}

interface ShootingStar {
  particles: THREE.Points[];
  startPos: THREE.Vector3;
  endPos: THREE.Vector3;
  progress: number;
  speed: number;
  active: boolean;
}

export function createShootingStars(ctx: SceneContext): ShootingStarsHandle {
  const { scene } = ctx;
  const stars: ShootingStar[] = [];
  const trailLength = 25;
  const spawnRadius = 60;

  function createStar(): ShootingStar {
    const particles: THREE.Points[] = [];
    
    const angle = Math.random() * Math.PI * 2;
    const elevation = (Math.random() - 0.5) * Math.PI * 0.5;
    
    const startPos = new THREE.Vector3(
      Math.cos(angle) * Math.cos(elevation) * spawnRadius,
      Math.sin(elevation) * spawnRadius,
      Math.sin(angle) * Math.cos(elevation) * spawnRadius
    );

    const targetAngle = angle + Math.PI + (Math.random() - 0.5) * 1;
    const targetElevation = elevation + (Math.random() - 0.5) * 0.5;
    
    const endPos = new THREE.Vector3(
      Math.cos(targetAngle) * Math.cos(targetElevation) * spawnRadius * 0.3,
      Math.sin(targetElevation) * spawnRadius * 0.3,
      Math.sin(targetAngle) * Math.cos(targetElevation) * spawnRadius * 0.3
    );

    for (let i = 0; i < trailLength; i++) {
      const geometry = new THREE.BufferGeometry();
      const position = new Float32Array(3);
      geometry.setAttribute('position', new THREE.BufferAttribute(position, 3));

      const fade = 1 - (i / trailLength);
      const size = 0.08 * fade;
      
      const color = new THREE.Color();
      color.lerpColors(
        new THREE.Color(0xe8e0d4),
        new THREE.Color(0xa07850),
        i / trailLength
      );

      const material = new THREE.PointsMaterial({
        size,
        color,
        transparent: true,
        opacity: fade * 0.9,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      const points = new THREE.Points(geometry, material);
      particles.push(points);
      scene.add(points);
    }

    return {
      particles,
      startPos,
      endPos,
      progress: 0,
      speed: 0.18 + Math.random() * 0.15,
      active: true,
    };
  }

  for (let i = 0; i < 25; i++) {
    stars.push(createStar());
  }

  function tick(elapsed: number) {
    stars.forEach((star) => {
      if (!star.active) return;

      star.progress += star.speed * 0.024;

      if (star.progress >= 1.0) {
        star.progress = 0;
        
        const angle = Math.random() * Math.PI * 2;
        const elevation = (Math.random() - 0.5) * Math.PI * 0.5;
        
        star.startPos.set(
          Math.cos(angle) * Math.cos(elevation) * spawnRadius,
          Math.sin(elevation) * spawnRadius,
          Math.sin(angle) * Math.cos(elevation) * spawnRadius
        );

        const targetAngle = angle + Math.PI + (Math.random() - 0.5) * 1;
        const targetElevation = elevation + (Math.random() - 0.5) * 0.5;
        
        star.endPos.set(
          Math.cos(targetAngle) * Math.cos(targetElevation) * spawnRadius * 0.3,
          Math.sin(targetElevation) * spawnRadius * 0.3,
          Math.sin(targetAngle) * Math.cos(targetElevation) * spawnRadius * 0.3
        );

        star.speed = 0.18 + Math.random() * 0.15;
      }

      star.particles.forEach((points, i) => {
        const trailOffset = i / trailLength;
        const t = Math.max(0, star.progress - trailOffset * 0.1);
        
        const bezierT = t * t * (3 - 2 * t);
        
        const pos = new THREE.Vector3().lerpVectors(
          star.startPos,
          star.endPos,
          bezierT
        );

        const posArray = points.geometry.attributes.position.array as Float32Array;
        posArray[0] = pos.x;
        posArray[1] = pos.y;
        posArray[2] = pos.z;
        points.geometry.attributes.position.needsUpdate = true;

        const material = points.material as THREE.PointsMaterial;
        const fade = 1 - trailOffset;
        const activeAlpha = Math.min(1, star.progress * 3) * Math.max(0, 1 - (star.progress - 0.8) * 5);
        material.opacity = fade * 0.9 * activeAlpha;
      });
    });
  }

  function dispose() {
    stars.forEach((star) => {
      star.particles.forEach((points) => {
        scene.remove(points);
        points.geometry.dispose();
        (points.material as THREE.Material).dispose();
      });
    });
  }

  return { tick, dispose };
}
