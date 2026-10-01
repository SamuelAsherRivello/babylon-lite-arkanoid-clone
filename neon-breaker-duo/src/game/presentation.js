export const REMOTE_PADDLE_INTERPOLATION_MS = 75;

export function pushGameSnapshot(history, gameState, receivedAt, maxSamples = 8) {
  if (!gameState || !Number.isFinite(receivedAt) || maxSamples < 2) return history;
  const previous = history.at(-1);
  if (previous?.gameState === gameState) return history;
  history.push({ receivedAt, gameState });
  if (history.length > maxSamples) history.splice(0, history.length - maxSamples);
  return history;
}

export function samplePaddlePositions(history, sampleAt) {
  if (history.length === 0) return [];
  const latest = history.at(-1);
  if (sampleAt > latest.receivedAt) {
    const elapsedSeconds = Math.min(0.05, (sampleAt - latest.receivedAt) / 1000);
    return (latest.gameState.paddles ?? []).map((paddle) => ({
      ...paddle,
      x: advancePaddleTowardTarget(paddle.x, paddle.target, elapsedSeconds),
    }));
  }
  let nextIndex = history.findIndex((sample) => sample.receivedAt >= sampleAt);
  if (nextIndex === 0) return history[0].gameState.paddles ?? [];

  const before = history[nextIndex - 1];
  const after = history[nextIndex];
  const duration = after.receivedAt - before.receivedAt;
  if (duration <= 0) return after.gameState.paddles ?? [];
  const amount = Math.max(0, Math.min(1, (sampleAt - before.receivedAt) / duration));
  const beforeBySeat = new Map((before.gameState.paddles ?? []).map((paddle) => [paddle.seat, paddle]));

  return (after.gameState.paddles ?? []).map((paddle) => {
    const previous = beforeBySeat.get(paddle.seat);
    if (!previous) return paddle;
    return {
      ...paddle,
      x: previous.x + (paddle.x - previous.x) * amount,
      width: previous.width + (paddle.width - previous.width) * amount,
    };
  });
}

export function laneTargetX(seat, lanePosition) {
  if (seat !== 0 && seat !== 1) return 160;
  const lo = seat === 0 ? 20 : 180;
  const x = Number.isFinite(lanePosition) ? Math.max(0, Math.min(1, lanePosition)) : 0.5;
  return lo + x * 120;
}

export function advancePaddleTowardTarget(position, target, elapsedSeconds, speed = 260) {
  if (![position, target, elapsedSeconds, speed].every(Number.isFinite) || elapsedSeconds <= 0 || speed < 0) return position;
  const maxDistance = speed * Math.min(elapsedSeconds, 0.05);
  return position + Math.max(-maxDistance, Math.min(maxDistance, target - position));
}
