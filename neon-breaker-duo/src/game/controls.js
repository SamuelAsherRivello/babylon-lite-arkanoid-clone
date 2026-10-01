export function toLaneInput(stageFraction, seat) {
  if (!Number.isFinite(stageFraction) || (seat !== 0 && seat !== 1)) return 0.5;
  return Math.max(0, Math.min(1, (stageFraction - seat * 0.5) * 2));
}
export function moveLaneInput(input, direction, step = 0.045) {
  return Math.max(0, Math.min(1, input + Math.sign(direction) * step));
}
