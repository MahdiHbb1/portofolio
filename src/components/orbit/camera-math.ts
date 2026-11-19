export interface Vec3Like {
  x: number;
  y: number;
  z: number;
}

/**
 * Places the camera in front of the panel along the vector from the panel
 * toward the viewer's current camera position so zoom never passes through
 * the central blob.
 */
export function computePanelCameraTarget(
  cameraPos: Vec3Like,
  panelPos: Vec3Like,
  distance = 2.4,
): Vec3Like {
  const dx = cameraPos.x - panelPos.x;
  const dy = cameraPos.y - panelPos.y;
  const dz = cameraPos.z - panelPos.z;
  const lenSq = dx * dx + dy * dy + dz * dz;

  if (lenSq < 1e-6) {
    return {
      x: panelPos.x,
      y: panelPos.y,
      z: panelPos.z + distance,
    };
  }

  const invLen = 1 / Math.sqrt(lenSq);
  return {
    x: panelPos.x + dx * invLen * distance,
    y: panelPos.y + dy * invLen * distance,
    z: panelPos.z + dz * invLen * distance,
  };
}
