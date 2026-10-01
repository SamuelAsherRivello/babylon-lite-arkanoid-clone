# Design

## Context

See proposal.md for motivation and specs for observable requirements. The generated project is a React/Vite shell whose Babylon Lite renderer currently presents a showcase. Shared online sessions run on a separate Colyseus server with ephemeral in-memory state.

## Goals / Non-Goals

**Goals:** Preserve the template's Babylon Lite WebGPU renderer and React shell while replacing the sample content with an original portrait game; use released and pinned multiplayer client code; make rules deterministic and independently testable; keep server-authoritative outcomes isolated from rendering and input.

**Non-Goals:** Exact reproduction of copyrighted Arkanoid assets, level layouts, or sound; accounts or persistent identity; offline single-player fallback; durable matches; global pause; more than two players.

## Decisions

- Use a 320×576 logical stage and existing Babylon Lite pixel-perfect sprite pipeline. Choose it over Canvas/custom rendering so app stays on the mandated renderer and existing resize/scale behavior.
- Keep React responsible for connection/match HUD and controls; make the server own fixed-step simulation, collision, brick state, drops, scoring, and transitions. The client sends normalized paddle targets and discrete launch/restart intents only. This prevents divergent client outcomes; a client-only simulation was rejected.
- Extend the shared server with a new registry-isolated game identifier and preserve unrelated rooms. Publish the compatible client package and deploy the server before adding that exact version to the game lockfile.
- Represent the board, ball list, both paddles, powerup timers, wave, score, lives, and outcome in late-join snapshots. Send bounded state snapshots at the server's existing game broadcast cadence; the renderer interpolates positions without changing game rules.
- Author original pixel-art sprites and a cosmic background with a cosmic arcade palette, bold silhouettes, and brick patterns that communicate durability. Gameplay is inspired by the cited Arkanoid: Revenge of Doh reference; artwork, level layouts, title, and presentation are original. This release is intentionally silent; there is no sound or music asset.
- Use three fixed waves, three shared lives, two lane paddles, a one-in-eight drop chance, eight-second wide paddles, and at most three balls. This resolves unspecified gameplay values in the prompt and keeps a finite, testable loop.
- Configure local and production backend URLs independently. GitHub Pages serves the static client under `/babylon-lite-arkanoid-clone/`; the live backend URL is secure and has no credentials embedded in client assets.

## Risks / Trade-offs

- **Ephemeral server sessions can reset when the last player leaves or a deployment restarts** → State these limits in the README and expose reconnect/full states.
- **Hosted function lifetimes or independent server instances can interrupt or partition sessions** → Verify against actual deployment and report observed scope; do not promise durable rooms.
- **Pixel-perfect portrait content may be small in landscape desktops** → Use template gutters and responsive scaling while keeping controls visible.
- **Fast authoritative balls may look jittery over network latency** → Interpolate visual positions between snapshots while retaining server collision authority.
- **WebGPU is not universal** → Provide a clear supported-browser recovery message; do not silently change renderer.

## Migration Plan

1. Add and test the isolated game contract in the shared server, update its registry/docs/integration checks, and publish/deploy a compatible client release.
2. Integrate that exact release in the game, create original assets and the playable client, then verify two independent clients against local and public endpoints.
3. Run app checks and production/Pages builds; commit and push the server and game separately; invoke their checked-in release/deploy workflows and verify the public game.
4. Roll back by redeploying the previous server release if its workflow fails; the static client remains pinned to the last compatible published client package. Do not force-push or remove prior artifacts.

## Open Questions

None. Values and lifecycle policies are specified above.
