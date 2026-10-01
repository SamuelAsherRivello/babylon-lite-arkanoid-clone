export function toPaddleInput(stageFraction) {
  if (!Number.isFinite(stageFraction)) return 0.5;
  return Math.max(0, Math.min(1, stageFraction));
}
export function movePaddleInput(input, direction, step = 0.045) {
  return Math.max(0, Math.min(1, input + Math.sign(direction) * step));
}
