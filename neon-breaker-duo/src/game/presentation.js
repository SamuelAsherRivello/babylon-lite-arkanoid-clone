// The room publishes at 20 Hz. A fixed buffer gives clients with uneven
// delivery a stable playback clock; changing the delay per packet can stall
// that clock and then make it catch up in visible bursts.
export const REMOTE_PADDLE_INTERPOLATION_MS = 250;

export function pushGameSnapshot(history, gameState, receivedAt, maxSamples = 8) {
  if (!gameState || !Number.isFinite(receivedAt) || maxSamples < 2) return history;
  // Copy mutable server state at receipt time. React may coalesce renders, and
  // retaining an object reference can make old samples reflect only new values.
  const snapshot = { ...gameState, paddles: (gameState.paddles ?? []).map((paddle) => ({ ...paddle })) };
  const previous = history.at(-1);
  if (previous && receivedAt <= previous.receivedAt) receivedAt = previous.receivedAt + 0.01;
  history.push({ receivedAt, gameState: snapshot });
  if (history.length > maxSamples) history.splice(0, history.length - maxSamples);
  return history;
}

export function getRemotePaddleInterpolationDelay() {
  return REMOTE_PADDLE_INTERPOLATION_MS;
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

export function paddleTargetX(input, width = 38, boardWidth = 320) {
  const x = Number.isFinite(input) ? Math.max(0, Math.min(1, input)) : 0.5;
  const half = Math.max(0, width) / 2;
  return half + x * (boardWidth - half * 2);
}

export function advancePaddleTowardTarget(position, target, elapsedSeconds, speed = 260) {
  if (![position, target, elapsedSeconds, speed].every(Number.isFinite) || elapsedSeconds <= 0 || speed < 0) return position;
  const maxDistance = speed * Math.min(elapsedSeconds, 0.05);
  return position + Math.max(-maxDistance, Math.min(maxDistance, target - position));
}

// A tiny render-only low-pass filter hides subpixel stepping when received
// snapshots arrive unevenly. The time-based factor behaves the same at 60 Hz
// and 120 Hz, and is intentionally independent of authoritative game state.
export function smoothRemotePaddlePosition(position, target, elapsedSeconds, responseTime = 0.045) {
  if (![position, target, elapsedSeconds, responseTime].every(Number.isFinite) || elapsedSeconds <= 0 || responseTime <= 0) return position;
  const alpha = 1 - Math.exp(-Math.min(elapsedSeconds, 0.05) / responseTime);
  return position + (target - position) * alpha;
}
