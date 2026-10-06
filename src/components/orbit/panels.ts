import * as THREE from 'three';
import type { SceneContext } from './scene';

// Data 7 project — posisi di layer ditentukan di sini, bukan hardcode di loop
export interface ProjectEntry {
  id: string;
  label: string;
  category: string;
  color: number; // hex warna placeholder
}

export const PROJECTS: ProjectEntry[] = [
  { id: 'fraudlens',       label: 'FraudLens',         category: 'fraud detection',    color: 0x1a1410 },
  { id: 'fabric-cnn',      label: 'Fabric Defect CNN', category: 'computer vision',    color: 0x0e1318 },
  { id: 'legalin',         label: 'LegalIn',           category: 'AI legal assistant', color: 0x101814 },
  { id: 'buktitagih',      label: 'BuktiTagih AI',     category: 'hackathon',          color: 0x181410 },
  { id: 'sigap-mbg',       label: 'SIGAP MBG',         category: 'hardware+software',  color: 0x0f1519 },
  { id: 'ctf-itsecdevx26', label: 'CTF itsecdevx26',   category: 'security',           color: 0x13100e },
  { id: 'ctf-writeups',    label: 'CTF Writeups',      category: 'writeups',           color: 0x141118 },
];

// Tiga lapisan — radius & kecepatan angular berbeda (Opsi A)
// Rasio speed ~2× tiap step biar gradasi terasa jelas
const LAYERS = [
  { indices: [0, 1],    radius: 2.4, speed: 0.07, axis: new THREE.Vector3(0, 1, 0) },
  { indices: [2, 3, 4], radius: 3.6, speed: 0.14, axis: new THREE.Vector3(0.25, 1, 0.15).normalize() },
  { indices: [5, 6],    radius: 5.2, speed: 0.24, axis: new THREE.Vector3(0.08, 1, 0.28).normalize() },
];

// Placeholder texture — kontras lebih tinggi, border tegas, noise subtle
function makePlaceholderTexture(project: ProjectEntry): THREE.CanvasTexture {
  const W = 480, H = 300;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const g = cv.getContext('2d')!;

  // Background — sedikit lebih terang dari sebelumnya agar kontras dengan scene
  const hex = project.color.toString(16).padStart(6, '0');
  g.fillStyle = `#${hex}`;
  g.fillRect(0, 0, W, H);

  // Subtle gradient overlay — kesan depth
  const grad = g.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, 'rgba(232, 224, 212, 0.04)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0.18)');
  g.fillStyle = grad;
  g.fillRect(0, 0, W, H);

  // Border luar — tegas, warm off-white
  g.strokeStyle = 'rgba(232, 224, 212, 0.45)';
  g.lineWidth = 2.5;
  g.strokeRect(1.5, 1.5, W - 3, H - 3);

  // Header bar tipis di atas
  g.fillStyle = 'rgba(160, 120, 80, 0.18)';
  g.fillRect(0, 0, W, 32);

  // Tiga dot window chrome (kiri atas)
  const dotY = 16;
  [12, 28, 44].forEach((x, i) => {
    g.beginPath();
    g.arc(x, dotY, 4, 0, Math.PI * 2);
    g.fillStyle = i === 0
      ? 'rgba(232, 224, 212, 0.5)'
      : 'rgba(232, 224, 212, 0.2)';
    g.fill();
  });

  // Garis separator bawah header
  g.strokeStyle = 'rgba(160, 120, 80, 0.35)';
  g.lineWidth = 1;
  g.beginPath();
  g.moveTo(0, 32); g.lineTo(W, 32);
  g.stroke();

  // Nama project — besar, tegas
  g.fillStyle = 'rgba(232, 224, 212, 0.95)';
  g.font = 'bold 32px monospace';
  g.textBaseline = 'middle';
  g.fillText(project.label, 24, H / 2 - 14);

  // Kategori
  g.fillStyle = 'rgba(160, 120, 80, 0.85)';
  g.font = '15px monospace';
  g.fillText(project.category, 24, H / 2 + 22);

  return new THREE.CanvasTexture(cv);
}

export interface PanelHandle {
  tick: (elapsed: number, camera: THREE.Camera) => void;
  meshes: THREE.Mesh[];
  dispose: () => void;
}

export function createPanels(ctx: SceneContext): PanelHandle {
  const { scene } = ctx;

  const panelW = 1.6;
  const panelH = 1.0;
  const geo = new THREE.PlaneGeometry(panelW, panelH);

  const meshes: THREE.Mesh[] = [];
  // Tiap panel simpan data layer & sudut awal
  const panelMeta: { layerIdx: number; initialAngle: number }[] = [];

  for (let li = 0; li < LAYERS.length; li++) {
    const layer = LAYERS[li];
    const count = layer.indices.length;

    for (let k = 0; k < count; k++) {
      const projectIdx = layer.indices[k];
      const project = PROJECTS[projectIdx];

      // Sudut awal merata dalam layer
      const initialAngle = (k / count) * Math.PI * 2;

      const texture = makePlaceholderTexture(project);
      const mat = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 0.95,
        depthWrite: false,
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.userData = { projectId: project.id };
      scene.add(mesh);
      meshes.push(mesh);
      panelMeta.push({ layerIdx: li, initialAngle });
    }
  }

  // Quaternion reusable untuk rotasi axis-angle tiap frame
  const quat = new THREE.Quaternion();

  function tick(elapsed: number, camera: THREE.Camera) {
    let meshIdx = 0;

    for (let li = 0; li < LAYERS.length; li++) {
      const layer = LAYERS[li];
      const count = layer.indices.length;

      for (let k = 0; k < count; k++) {
        const mesh = meshes[meshIdx];
        const { initialAngle } = panelMeta[meshIdx];
        meshIdx++;

        // Angle orbit saat ini
        const angle = initialAngle + elapsed * layer.speed;

        // Posisi di lingkaran sekitar axis layer
        // Kita pakai rotasi axis-angle: putar vektor referensi di bidang tegak lurus axis
        // Untuk sumbu Y murni: x = cos(angle)*r, z = sin(angle)*r
        // Untuk axis miring: kita putar titik awal pakai quaternion
        const refVec = new THREE.Vector3(layer.radius, 0, 0);
        quat.setFromAxisAngle(layer.axis, angle);
        refVec.applyQuaternion(quat);
        mesh.position.copy(refVec);

        // Billboard: panel selalu menghadap kamera
        mesh.lookAt(camera.position);
      }
    }
  }

  function dispose() {
    meshes.forEach(m => {
      scene.remove(m);
      (m.material as THREE.MeshBasicMaterial).map?.dispose();
      (m.material as THREE.MeshBasicMaterial).dispose();
    });
    geo.dispose();
  }

  return { tick, meshes, dispose };
}
