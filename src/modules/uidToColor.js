export function uidToColor(uid) {
  // 32-bit hash
  let h = uid >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
  h = h ^ (h >>> 16);

  // Extract RGB
  const r = (h >> 16) & 255;
  const g = (h >> 8) & 255;
  const b = h & 255;

  return `#${r.toString(16).padStart(2,"0")}${g.toString(16).padStart(2,"0")}${b.toString(16).padStart(2,"0")}`;
}