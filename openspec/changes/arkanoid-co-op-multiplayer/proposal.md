# Proposal

## Why

The generated repository currently contains only a Babylon Lite pixel-art showcase, so it does not deliver the requested playable multiplayer brick breaker. This change turns the starter into a complete, two-player online game with a documented launch path and a separately released authoritative server contract.

## What Changes

- Replace the template showcase with **Neon Breaker Duo**, an original portrait Arkanoid-inspired game on a 320×576 logical stage, rendered with Babylon Lite 1.32.0 and WebGPU using the existing nearest-sampled pixel-perfect pipeline.
- Deliver a complete cooperative session: two players share one board, score, lives, brick waves, power-ups, victory/defeat, and replay. Each player owns one independently controlled paddle in a fixed half of the bottom defense line; the ball may be returned by either paddle.
- Extend the shared Colyseus server with an isolated `neon-breaker-duo` game room, bounded paddle inputs, authoritative simulation and transitions, full snapshots for late joiners, two-seat admission, and game-specific integration coverage. Preserve all existing games and protocols; release the compatible shared client before integrating the frontend.
- Add desktop keyboard and pointer/touch controls, clear multiplayer connection/retry/full states, focus-safe input release, local pause that never pauses the shared session, and useful WebGPU initialization recovery.
- Replace template placeholder copy and assets with the project’s identity. Document the exact local README launch steps, controls, public demo when released, multiplayer hosting/session limits, original asset provenance, and the submitted prompt in a collapsible block.
- Verify the rules, server contract with two clients, production build and Pages subpath, and the actual browser game on desktop and narrow mobile layouts. Release and deploy the shared server before publishing the static client.

## Capabilities

### New Capabilities

- `cooperative-breaker-game`: Complete two-player Arkanoid-inspired gameplay, authoritative shared sessions, controls, presentation, recovery, and replay.

### Modified Capabilities

- `babylon-lite-content`: Replace the template’s default rotating showcase with the playable game while retaining its Babylon Lite WebGPU and 2D Pixel Perfect guarantees.

## Impact

- Game client in the renamed Vite app directory; React HUD and template shell; Babylon Lite rendering, controls, generated original artwork, tests, README, and GitHub Pages configuration.
- Sibling `rmc-colyseus-multiplayer-server` repository: isolated simulation/room, registry, shared-client contract/documentation, integration and deployment checks, and a versioned release. Existing sessions are in-memory and hosting may reset them; clients use fresh anonymous identities after reconnect.
- Runtime dependency on the exact released `@rmc/multiplayer-client` asset. No credentials or server secrets in the browser bundle.
