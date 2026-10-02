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
  // Keep timelineAt in the same monotonic clock domain as receivedAt and the
  // render loop's performance.now(). Server Date.now() is an epoch clock and
  // cannot be compared directly with performance.now(); use it only to measure
  // the interval between snapshots, anchored to the first local receipt.
  let timelineAt = receivedAt;
  if (previous) {
    const hasServerInterval = Number.isFinite(snapshot.serverTime)
      && Number.isFinite(previous.gameState.serverTime)
      && snapshot.serverTime > previous.gameState.serverTime;
    if (hasServerInterval) {
      timelineAt = previous.timelineAt + (snapshot.serverTime - previous.gameState.serverTime);
    } else {
      // Older deployed servers don't send a server clock. Normalize ordinary
      // packet-arrival variation to the room's 20 Hz cadence, while preserving
      // gaps long enough to indicate one or more missed snapshots.
      const arrivalGap = receivedAt - previous.receivedAt;
      const tickCount = arrivalGap < 100 ? 1 : Math.max(1, Math.round(arrivalGap / 50));
      timelineAt = previous.timelineAt + tickCount * 50;
    }
  }
  const orderedTimelineAt = previous && timelineAt <= previous.timelineAt ? previous.timelineAt + 0.01 : timelineAt;
  history.push({ receivedAt, timelineAt: orderedTimelineAt, gameState: snapshot });
  // Keep a stable mapping between this server timeline and the client's
  // monotonic clock. Re-anchoring playback to each packet's receipt time makes
  // network transit variation move the playback clock forward and backward.
  history.playbackAnchor ??= { receivedAt, timelineAt: orderedTimelineAt };
  if (history.length > maxSamples) history.splice(0, history.length - maxSamples);
  return history;
}

export function getRemotePaddleInterpolationDelay() {
  return REMOTE_PADDLE_INTERPOLATION_MS;
}

// Advance server time using the latest packet's local receipt anchor. This
// preserves the server's regular snapshot spacing while accounting for render
// time elapsed since arrival, instead of letting network delivery jitter bend
// the interpolation timeline.
export function getRemotePaddleSampleTime(history, now, delay = REMOTE_PADDLE_INTERPOLATION_MS) {
  const anchor = history.playbackAnchor;
  return anchor ? anchor.timelineAt + (now - anchor.receivedAt) - delay : now - delay;
}

export function samplePaddlePositions(history, sampleAt) {
  if (history.length === 0) return [];
  const latest = history.at(-1);
  if (sampleAt > latest.timelineAt) {
    const elapsedSeconds = Math.min(0.05, (sampleAt - latest.timelineAt) / 1000);
    return (latest.gameState.paddles ?? []).map((paddle) => ({
      ...paddle,
      x: advancePaddleTowardTarget(paddle.x, paddle.target, elapsedSeconds),
    }));
  }
  let nextIndex = history.findIndex((sample) => sample.timelineAt >= sampleAt);
  if (nextIndex === 0) return history[0].gameState.paddles ?? [];

  const before = history[nextIndex - 1];
  const after = history[nextIndex];
  const duration = after.timelineAt - before.timelineAt;
  if (duration <= 0) return after.gameState.paddles ?? [];
  const amount = Math.max(0, Math.min(1, (sampleAt - before.timelineAt) / duration));
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
