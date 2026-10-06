import * as THREE from 'three';

/**
 * Animate camera to target position with cubic easing
 * Purpose (R-19): Smooth zoom creates immersive panel focus
 */
export function animateCameraToTarget(
  camera: THREE.Camera,
  targetPos: THREE.Vector3,
  lookAtPos: THREE.Vector3,
  duration: number,
  onComplete?: () => void
): () => void {
  const startPos = camera.position.clone();
  const startTime = performance.now();
  let rafId: number;

  // Cubic ease-in-out
  const easing = (t: number) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  function animate() {
    const elapsed = performance.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const t = easing(progress);

    camera.position.lerpVectors(startPos, targetPos, t);
    camera.lookAt(lookAtPos);

    if (progress < 1) {
      rafId = requestAnimationFrame(animate);
    } else {
      onComplete?.();
    }
  }

  animate();
  return () => cancelAnimationFrame(rafId);
}
