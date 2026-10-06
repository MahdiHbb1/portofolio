import * as THREE from 'three';

export interface SceneContext {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  timer: THREE.Timer;
  canvas: HTMLCanvasElement;
  dispose: () => void;
}

export function createScene(canvas: HTMLCanvasElement, initialZ = 7): SceneContext {
  // Renderer
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  renderer.setClearColor(0x000000, 0); // transparent — background dari CSS

  // Camera
  const aspect = canvas.clientWidth / canvas.clientHeight;
  const camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 100);
  camera.position.set(0, 0, initialZ);

  // Scene
  const scene = new THREE.Scene();

  // Add volumetric fog for atmospheric depth (reduced density for better visibility)
  // Purpose (R-01): Fog creates depth perception, enhances space atmosphere
  scene.fog = new THREE.FogExp2(0x0f0e0d, 0.008); // Warm brown-black fog

  // Ambient — warm brown tint matching DESIGN.md palette
  const ambient = new THREE.AmbientLight(0xe8e0d4, 0.08);
  scene.add(ambient);

  // Point light dari atas-depan untuk rim tipis di blob
  const keyLight = new THREE.PointLight(0xd0b090, 1.2, 20); // Warm cream brown
  keyLight.position.set(3, 4, 5);
  scene.add(keyLight);

  const timer = new THREE.Timer();

  // Resize handler
  function onResize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', onResize);

  function dispose() {
    window.removeEventListener('resize', onResize);
    renderer.dispose();
  }

  return { renderer, scene, camera, timer, canvas, dispose };
}

export function startLoop(
  ctx: SceneContext,
  onTick: (elapsed: number, delta: number) => void,
): () => void {
  let rafId: number;

  function loop() {
    rafId = requestAnimationFrame(loop);
    ctx.timer.update();
    const elapsed = ctx.timer.getElapsed();
    const delta = ctx.timer.getDelta();
    onTick(elapsed, delta);
    ctx.renderer.render(ctx.scene, ctx.camera);
  }

  loop();

  return () => cancelAnimationFrame(rafId);
}
