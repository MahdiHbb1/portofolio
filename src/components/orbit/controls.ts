import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { SceneContext } from './scene';
import type { PanelHandle } from './panels';
import { animateCameraToTarget } from './camera-animator';
import { getProjectById, getLocalizedProject } from '../../data/projects.ts';
import { content } from '../../data/content.ts';
import { computePanelCameraTarget } from './camera-math.ts';

const INITIAL_CAMERA_POS = new THREE.Vector3(0, 0, 7);
const INITIAL_TARGET = new THREE.Vector3(0, 0, 0);

const ViewState = {
  ORBIT: 'orbit',
  TRANSITIONING: 'transitioning',
  DETAIL: 'detail',
} as const;

type ViewStateValue = (typeof ViewState)[keyof typeof ViewState];

export interface ControlHandle {
  tick: () => void;
  isInspecting: () => boolean;
  dispose: () => void;
}

export function createControls(
  ctx: SceneContext,
  resetBtn: HTMLElement | null,
  panels: PanelHandle,
  options: { lang?: 'id' | 'en' } = {},
): ControlHandle {
  const { camera, canvas } = ctx;
  const lang = options.lang ?? 'id';

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.enablePan = false;
  controls.minDistance = 3.5;
  controls.maxDistance = 10;
  controls.rotateSpeed = 0.55;
  controls.zoomSpeed = 0.7;
  controls.minPolarAngle = Math.PI * 0.1;
  controls.maxPolarAngle = Math.PI * 0.9;

  let currentState: ViewStateValue = ViewState.ORBIT;
  let cancelAnimation: (() => void) | null = null;
  let lastFocusedElement: HTMLElement | null = null;
  const savedCameraPos = new THREE.Vector3();
  const savedTarget = new THREE.Vector3();

  function onReset() {
    if (currentState !== ViewState.ORBIT) return;
    camera.position.copy(INITIAL_CAMERA_POS);
    controls.target.copy(INITIAL_TARGET);
    controls.update();
  }
  resetBtn?.addEventListener('click', onReset);

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const pointerDownPos = new THREE.Vector2();
  let didDrag = false;

  function onPointerDown(e: PointerEvent) {
    pointerDownPos.set(e.clientX, e.clientY);
    didDrag = false;
  }

  function onPointerMove(e: PointerEvent) {
    const dx = e.clientX - pointerDownPos.x;
    const dy = e.clientY - pointerDownPos.y;
    if (Math.sqrt(dx * dx + dy * dy) > 4) didDrag = true;
  }

  function onPointerUp(e: PointerEvent) {
    if (didDrag || currentState !== ViewState.ORBIT) return;

    const rect = canvas.getBoundingClientRect();
    pointer.set(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
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
    savedCameraPos.copy(camera.position);
    savedTarget.copy(controls.target);

    controls.enabled = false;
    canvas.style.cursor = 'default';

    const targetVec = computePanelCameraTarget(camera.position, panel.position, 2.4);
    const cameraTarget = new THREE.Vector3(targetVec.x, targetVec.y, targetVec.z);

    cancelAnimation = animateCameraToTarget(
      camera,
      cameraTarget,
      panel.position.clone(),
      900,
      () => {
        currentState = ViewState.DETAIL;
        showModal(projectId);
      },
    );
  }

  function getActiveLang(): 'id' | 'en' {
    try {
      return localStorage.getItem('lang') === 'en' ? 'en' : 'id';
    } catch {
      return lang;
    }
  }

  function showModal(projectId: string) {
    const modal = document.getElementById('panel-modal');
    const rawProject = getProjectById(projectId);
    if (!modal || !rawProject) return;

    const activeLang = getActiveLang();
    const project = getLocalizedProject(rawProject, activeLang);
    const copy = content[activeLang].project;

    const yearEl = document.getElementById('modal-year');
    const titleEl = document.getElementById('modal-title');
    const categoryEl = document.getElementById('modal-category');
    const descEl = document.getElementById('modal-description');
    const tagsEl = document.getElementById('modal-tags');
    const linkEl = document.getElementById('modal-link') as HTMLAnchorElement | null;
    const backBtnEl = document.getElementById('modal-back');

    if (yearEl) yearEl.textContent = project.year;
    if (titleEl) titleEl.textContent = project.name;
    if (categoryEl) categoryEl.textContent = project.category;
    if (descEl) descEl.textContent = project.desc;

    if (tagsEl) {
      tagsEl.innerHTML = '';
      for (const tag of project.tags) {
        const li = document.createElement('li');
        li.className = 'panel-modal__tag';
        li.textContent = tag;
        tagsEl.appendChild(li);
      }
    }

    if (linkEl) {
      linkEl.setAttribute('href', `/projects/${project.id}/`);
      linkEl.textContent = copy.modalView;
    }
    if (backBtnEl) backBtnEl.textContent = copy.modalBack;

    lastFocusedElement = document.activeElement as HTMLElement | null;
    modal.setAttribute('data-state', 'visible');
    modal.setAttribute('aria-hidden', 'false');

    requestAnimationFrame(() => {
      linkEl?.focus();
    });
  }

  function returnToOverview() {
    if (currentState !== ViewState.DETAIL) return;

    const modal = document.getElementById('panel-modal');
    if (modal) {
      // Shift focus outside the dialog before setting aria-hidden="true"
      const active = document.activeElement;
      if (active instanceof HTMLElement && modal.contains(active)) {
        if (
          lastFocusedElement &&
          lastFocusedElement !== document.body &&
          lastFocusedElement.isConnected &&
          !modal.contains(lastFocusedElement)
        ) {
          lastFocusedElement.focus();
        } else if (resetBtn && resetBtn.isConnected) {
          resetBtn.focus();
        } else {
          active.blur();
        }
      }
      modal.setAttribute('data-state', 'hidden');
      modal.setAttribute('aria-hidden', 'true');
    }

    currentState = ViewState.TRANSITIONING;

    cancelAnimation = animateCameraToTarget(
      camera,
      savedCameraPos,
      savedTarget,
      900,
      () => {
        currentState = ViewState.ORBIT;
        controls.enabled = true;
        controls.update();
        canvas.style.cursor = 'grab';
        lastFocusedElement = null;
      },
    );
  }

  function onMouseMove(e: MouseEvent) {
    if (currentState !== ViewState.ORBIT) return;

    const rect = canvas.getBoundingClientRect();
    pointer.set(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1,
    );
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(panels.meshes, false);
    canvas.style.cursor = hits.length > 0 ? 'pointer' : 'grab';
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape' && currentState === ViewState.DETAIL) {
      returnToOverview();
    }
  }

  const backBtn = document.getElementById('modal-back');
  const closeBtn = document.getElementById('modal-close');
  const backdrop = document.querySelector('#panel-modal .panel-modal__backdrop');

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('mousemove', onMouseMove);
  backBtn?.addEventListener('click', returnToOverview);
  closeBtn?.addEventListener('click', returnToOverview);
  backdrop?.addEventListener('click', returnToOverview);
  document.addEventListener('keydown', onKeyDown);

  function tick() {
    // Only run OrbitControls while orbiting; otherwise its target overrides zoom lookAt.
    if (currentState === ViewState.ORBIT) {
      controls.update();
    }
  }

  function isInspecting() {
    return currentState !== ViewState.ORBIT;
  }

  function dispose() {
    resetBtn?.removeEventListener('click', onReset);
    canvas.removeEventListener('pointerdown', onPointerDown);
    canvas.removeEventListener('pointermove', onPointerMove);
    canvas.removeEventListener('pointerup', onPointerUp);
    canvas.removeEventListener('mousemove', onMouseMove);
    backBtn?.removeEventListener('click', returnToOverview);
    closeBtn?.removeEventListener('click', returnToOverview);
    backdrop?.removeEventListener('click', returnToOverview);
    document.removeEventListener('keydown', onKeyDown);

    const modal = document.getElementById('panel-modal');
    if (modal) {
      modal.setAttribute('data-state', 'hidden');
      modal.setAttribute('aria-hidden', 'true');
    }

    canvas.style.cursor = '';
    cancelAnimation?.();
    controls.dispose();
  }

  return { tick, isInspecting, dispose };
}
