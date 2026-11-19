import * as THREE from 'three';
import type { SceneContext } from './scene';
import { getProjectById, type ProjectEntry } from '../../data/projects.ts';
import { content } from '../../data/content.ts';
import { ORBIT_LAYER_SPECS, buildCardModel, wrapCardText } from './card-layout.ts';

interface LayerMeta {
  radius: number;
  speed: number;
  axis: THREE.Vector3;
}

function drawRoundedRect(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  g.beginPath();
  g.moveTo(x + r, y);
  g.lineTo(x + w - r, y);
  g.quadraticCurveTo(x + w, y, x + w, y + r);
  g.lineTo(x + w, y + h - r);
  g.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  g.lineTo(x + r, y + h);
  g.quadraticCurveTo(x, y + h, x, y + h - r);
  g.lineTo(x, y + r);
  g.quadraticCurveTo(x, y, x + r, y);
  g.closePath();
}

function makeProjectCardTexture(
  project: ProjectEntry,
  lang: 'id' | 'en',
  maxAnisotropy: number,
): THREE.CanvasTexture {
  const W = 640;
  const H = 400;
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const g = cv.getContext('2d')!;
  const model = buildCardModel(project, lang);

  // Warm dark base matching DESIGN.md palette
  const hex = model.cardColor.toString(16).padStart(6, '0');
  g.fillStyle = `#${hex}`;
  g.fillRect(0, 0, W, H);

  const grad = g.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, 'rgba(232, 224, 212, 0.05)');
  grad.addColorStop(1, 'rgba(10, 9, 8, 0.32)');
  g.fillStyle = grad;
  g.fillRect(0, 0, W, H);

  // Crisp frame
  g.strokeStyle = model.featured
    ? 'rgba(185, 143, 96, 0.82)'
    : 'rgba(232, 224, 212, 0.42)';
  g.lineWidth = model.featured ? 3 : 2;
  g.strokeRect(1.5, 1.5, W - 3, H - 3);

  // Window chrome header bar
  const headerH = 44;
  g.fillStyle = 'rgba(160, 120, 80, 0.16)';
  g.fillRect(0, 0, W, headerH);

  [24, 42, 60].forEach((x, i) => {
    g.beginPath();
    g.arc(x, headerH / 2, 5, 0, Math.PI * 2);
    g.fillStyle = i === 0 ? 'rgba(232, 224, 212, 0.58)' : 'rgba(232, 224, 212, 0.22)';
    g.fill();
  });

  g.strokeStyle = 'rgba(160, 120, 80, 0.35)';
  g.lineWidth = 1;
  g.beginPath();
  g.moveTo(0, headerH);
  g.lineTo(W, headerH);
  g.stroke();

  // Year and optional featured pill on right side of header
  g.font = '600 14px "JetBrains Mono", monospace';
  g.textBaseline = 'middle';
  g.textAlign = 'right';
  g.fillStyle = '#b98f60';
  g.fillText(model.year, W - 24, headerH / 2);

  if (model.featured) {
    const yearW = g.measureText(model.year).width;
    const badgeText = content[lang].project.featuredBadge;
    g.font = '600 11px "JetBrains Mono", monospace';
    const badgeTextW = g.measureText(badgeText).width;
    const badgeW = badgeTextW + 18;
    const badgeH = 22;
    const badgeX = W - 24 - yearW - 14 - badgeW;
    const badgeY = (headerH - badgeH) / 2;

    drawRoundedRect(g, badgeX, badgeY, badgeW, badgeH, 4);
    g.fillStyle = 'rgba(160, 120, 80, 0.26)';
    g.fill();
    g.strokeStyle = 'rgba(185, 143, 96, 0.6)';
    g.lineWidth = 1;
    g.stroke();

    g.textAlign = 'center';
    g.fillStyle = '#e8e0d4';
    g.fillText(badgeText, badgeX + badgeW / 2, headerH / 2 + 0.5);
  }

  // Body content
  const padX = 28;
  g.textAlign = 'left';
  g.textBaseline = 'top';

  g.font = '600 15px "JetBrains Mono", monospace';
  g.fillStyle = '#b98f60';
  g.fillText(model.category.toUpperCase(), padX, headerH + 24);

  const titleLines = wrapCardText(model.title, 24, 2);
  g.font = '700 32px "Space Grotesk", sans-serif';
  g.fillStyle = '#e8e0d4';
  let cursorY = headerH + 54;
  for (const line of titleLines) {
    g.fillText(line, padX, cursorY);
    cursorY += 38;
  }

  cursorY += 12;
  g.font = '400 18px "Space Grotesk", sans-serif';
  g.fillStyle = 'rgba(232, 224, 212, 0.82)';
  for (const line of model.descLines) {
    g.fillText(line, padX, cursorY);
    cursorY += 26;
  }

  // Bottom tag pills
  let tagX = padX;
  const tagY = H - 56;
  g.font = '500 13px "JetBrains Mono", monospace';
  g.textBaseline = 'middle';

  for (const tag of model.tags) {
    const labelW = g.measureText(tag).width;
    const pillW = labelW + 20;
    const pillH = 28;
    if (tagX + pillW > W - padX) break;

    drawRoundedRect(g, tagX, tagY, pillW, pillH, 4);
    g.fillStyle = 'rgba(160, 120, 80, 0.16)';
    g.fill();
    g.strokeStyle = 'rgba(160, 120, 80, 0.45)';
    g.lineWidth = 1;
    g.stroke();

    g.fillStyle = 'rgba(232, 224, 212, 0.9)';
    g.fillText(tag, tagX + 10, tagY + pillH / 2 + 0.5);
    tagX += pillW + 10;
  }

  const texture = new THREE.CanvasTexture(cv);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(4, maxAnisotropy);
  texture.needsUpdate = true;
  return texture;
}

export interface PanelHandle {
  tick: (elapsed: number, camera: THREE.Camera) => void;
  meshes: THREE.Mesh[];
  dispose: () => void;
}

export function createPanels(
  ctx: SceneContext,
  options: { lang?: 'id' | 'en' } = {},
): PanelHandle {
  const { scene, renderer } = ctx;
  const lang = options.lang ?? 'id';
  const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();

  const panelW = 1.6;
  const panelH = 1.0;
  const geo = new THREE.PlaneGeometry(panelW, panelH);

  const layers: LayerMeta[] = ORBIT_LAYER_SPECS.map((spec) => ({
    radius: spec.radius,
    speed: spec.speed,
    axis: new THREE.Vector3(spec.axis[0], spec.axis[1], spec.axis[2]).normalize(),
  }));

  const meshes: THREE.Mesh[] = [];
  const panelMeta: { layerIdx: number; initialAngle: number }[] = [];

  for (let li = 0; li < ORBIT_LAYER_SPECS.length; li++) {
    const spec = ORBIT_LAYER_SPECS[li];
    const count = spec.projectIds.length;

    for (let k = 0; k < count; k++) {
      const project = getProjectById(spec.projectIds[k]);
      if (!project) continue;

      const initialAngle = (k / count) * Math.PI * 2;
      const texture = makeProjectCardTexture(project, lang, maxAnisotropy);
      const mat = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 0.96,
        depthWrite: false,
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.userData = { projectId: project.id };
      scene.add(mesh);
      meshes.push(mesh);
      panelMeta.push({ layerIdx: li, initialAngle });
    }
  }

  const quat = new THREE.Quaternion();
  const refVec = new THREE.Vector3();

  function tick(elapsed: number, camera: THREE.Camera) {
    for (let i = 0; i < meshes.length; i++) {
      const mesh = meshes[i];
      const meta = panelMeta[i];
      const layer = layers[meta.layerIdx];

      const angle = meta.initialAngle + elapsed * layer.speed;
      refVec.set(layer.radius, 0, 0);
      quat.setFromAxisAngle(layer.axis, angle);
      refVec.applyQuaternion(quat);
      mesh.position.copy(refVec);
      mesh.lookAt(camera.position);
    }
  }

  function dispose() {
    meshes.forEach((m) => {
      scene.remove(m);
      const mat = m.material as THREE.MeshBasicMaterial;
      mat.map?.dispose();
      mat.dispose();
    });
    geo.dispose();
  }

  return { tick, meshes, dispose };
}
