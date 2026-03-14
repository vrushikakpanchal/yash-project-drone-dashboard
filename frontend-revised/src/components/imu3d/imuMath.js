export const DEG2RAD = Math.PI / 180;

export function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

export function normalizeAngleDeg(deg) {
  let a = (Number(deg) || 0) % 360;
  if (a > 180) a -= 360;
  if (a < -180) a += 360;
  return a;
}

