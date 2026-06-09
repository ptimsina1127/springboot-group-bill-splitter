const GOLDEN_ANGLE = 222.49;

export function getColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = ((Math.abs(hash) * GOLDEN_ANGLE) % 360).toFixed(1);
  return `hsla(${hue}, 72%, 62%, 0.35)`;
}
