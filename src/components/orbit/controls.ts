import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { SceneContext } from './scene';
import type { PanelHandle } from './panels';
import { animateCameraToTarget } from './camera-animator';
import { PROJECTS } from './panels';

const INITIAL_CAMERA_POS = new THREE.Vector3(0, 0, 7);
const INITIAL_TARGET     = new THREE.Vector3(0, 0, 0);

enum ViewState {
  ORBIT = 'orbit',
  TRANSITIONING = 'transitioning',
  DETAIL = 'detail'
}

export interface ControlHandle {
  tick: () => void;
  dispose: () => void;
}

export function createControls(
  ctx: SceneContext,
  resetBtn: HTMLElement | null,
  panels: PanelHandle,
): ControlHandle {
  const { camera, canvas, scene } = ctx;

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping   = true;
  controls.dampingFactor   = 0.06;
  controls.enablePan       = false;
  controls.minDistance     = 3.5;
  controls.maxDistance     = 10;
  controls.rotateSpeed     = 0.55;
  controls.zoomSpeed       = 0.7;
  controls.minPolarAngle   = Math.PI * 0.1;
  controls.maxPolarAngle   = Math.PI * 0.9;

  // State management
  let currentState = ViewState.ORBIT;
  let cancelAnimation: (() => void) | null = null;
  const savedCameraPos = new THREE.Vector3();
  const savedTarget = new THREE.Vector3();

  // Reset
  function onReset() {
    camera.position.copy(INITIAL_CAMERA_POS);
    controls.target.copy(INITIAL_TARGET);
    controls.update();
  }
  resetBtn?.addEventListener('click', onReset);

  // ── Raycaster: klik panel → navigate ke project page ──────────
  const raycaster  = new THREE.Raycaster();
  const pointer    = new THREE.Vector2();

  // Deteksi apakah pointer bergerak (drag) atau tidak (klik)
  // Supaya drag orbit tidak salah terpicu sebagai klik panel
  let pointerDownPos = new THREE.Vector2();
  let didDrag = false;

  function onPointerDown(e: PointerEvent) {
    pointerDownPos.set(e.clientX, e.clientY);
    didDrag = false;
  }

  function onPointerMove(e: PointerEvent) {
    const dx = e.clientX - pointerDownPos.x;
    const dy = e.clientY - pointerDownPos.y;
    // Threshold 4px — di bawah ini masih dianggap klik, bukan drag
    if (Math.sqrt(dx * dx + dy * dy) > 4) didDrag = true;
  }

  function onPointerUp(e: PointerEvent) {
    if (didDrag || currentState !== ViewState.ORBIT) return;

    const rect = canvas.getBoundingClientRect();
    pointer.set(
      ((e.clientX - rect.left)  / rect.width)  * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1,
    );

    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(panels.meshes, false);

    if (hits.length > 0) {
      const panel = hits[0].object as THREE.Mesh;
      const projectId = panel.userData.projectId as string | undefined;
      if (projectId) {
        zoomToPanel(panel, projectId);
      }
    }
  }

  function zoomToPanel(panel: THREE.Mesh, projectId: string) {
    currentState = ViewState.TRANSITIONING;
    
    // Save current state
    savedCameraPos.copy(camera.position);
    savedTarget.copy(controls.target);
    
    // Disable controls
    controls.enabled = false;
    
    // Reset cursor to default
    canvas.style.cursor = 'default';
    
    // Calculate camera position in front of panel
    const panelPos = panel.position.clone();
    const direction = panelPos.clone().normalize();
    const cameraTarget = panelPos.clone().add(direction.multiplyScalar(-2.5));
    
    // Animate camera
    cancelAnimation = animateCameraToTarget(camera, cameraTarget, panelPos, 1000, () => {
      currentState = ViewState.DETAIL;
      showModal(projectId);
    });
  }

  function showModal(projectId: string) {
    const modal = document.getElementById('panel-modal');
    const project = PROJECTS.find(p => p.id === projectId);
    
    if (!modal || !project) return;
    
    // Populate modal
    const titleEl = document.getElementById('modal-title');
    const categoryEl = document.getElementById('modal-category');
    const linkEl = document.getElementById('modal-link');
    
    if (titleEl) titleEl.textContent = project.label;
    if (categoryEl) categoryEl.textContent = project.category;
    if (linkEl) linkEl.setAttribute('href', `/projects/${projectId}`);
    
    // Show modal
    modal.setAttribute('data-state', 'visible');
  }

  function returnToOverview() {
    if (currentState !== ViewState.DETAIL) return;
    
    const modal = document.getElementById('panel-modal');
    if (modal) modal.setAttribute('data-state', 'hidden');
    
    currentState = ViewState.TRANSITIONING;
    
    // Animate camera back
    cancelAnimation = animateCameraToTarget(
      camera,
      savedCameraPos,
      savedTarget,
      1000,
      () => {
        currentState = ViewState.ORBIT;
        controls.enabled = true;
        controls.update();
        canvas.style.cursor = 'grab'; // Restore cursor
      }
    );
  }

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup',   onPointerUp);

  // Cursor: ubah ke pointer saat hover di atas panel
  function onMouseMove(e: MouseEvent) {
    if (currentState !== ViewState.ORBIT) return;
    
    const rect = canvas.getBoundingClientRect();
    pointer.set(
      ((e.clientX - rect.left)  / rect.width)  * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1,
    );
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(panels.meshes, false);
    canvas.style.cursor = hits.length > 0 ? 'pointer' : 'grab';
  }

  canvas.addEventListener('mousemove', onMouseMove);

  // Modal event listeners (defer to avoid SSR issues)
  if (typeof document !== 'undefined') {
    setTimeout(() => {
      const backBtn = document.getElementById('modal-back');
      const closeBtn = document.getElementById('modal-close');
      const backdrop = document.querySelector('.panel-modal__backdrop');
      
      backBtn?.addEventListener('click', returnToOverview);
      closeBtn?.addEventListener('click', returnToOverview);
      backdrop?.addEventListener('click', returnToOverview);
      
      // ESC key to close
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && currentState === ViewState.DETAIL) {
          returnToOverview();
        }
      });
    }, 0);
  }

  function tick() {
    controls.update();
  }

  function dispose() {
    resetBtn?.removeEventListener('click', onReset);
    canvas.removeEventListener('pointerdown', onPointerDown);
    canvas.removeEventListener('pointermove', onPointerMove);
    canvas.removeEventListener('pointerup',   onPointerUp);
    canvas.removeEventListener('mousemove',   onMouseMove);
    
    canvas.style.cursor = '';
    
    if (cancelAnimation) cancelAnimation();
    
    controls.dispose();
  }

  return { tick, dispose };
}
