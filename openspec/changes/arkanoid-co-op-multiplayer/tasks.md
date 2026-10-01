# Tasks

## 1. Multiplayer Server

- [x] 1.1 Create a server OpenSpec change for the isolated `neon-breaker-duo` room and verify its proposal, spec, design, and tasks with OpenSpec validation.
- [x] 1.2 Implement authoritative board state, fixed-step ball/bricks/paddle simulation, bounded owner-only inputs, three waves, lives, scoring, powerups, match transitions, late-join snapshots, and vacant-seat cleanup; verify with focused server rule and room tests.
- [x] 1.3 Register and document the game/client contract; add two-client, late-join, disconnect/rejoin, capacity, isolation, and game-rule integration coverage; verify typecheck and the server regression suite.
- [x] 1.4 Commit and push scoped server changes, run the checked-in Release workflow, and verify package URL/version, backend deployment, health, and live contract checks.

## 2. Game Client

- [x] 2.1 Rename the Vite app to `neon-breaker-duo`, set title/version/Pages base and portrait layout; verify template roles, package scripts, and production asset paths.
- [x] 2.2 Add original pixel-art sprites, three server-authored wave layouts, and art provenance; verify assets are present and load through the Babylon Lite nearest-sampled pixel-perfect renderer. Record the intentional no-audio scope in design and README.
- [x] 2.3 Implement the React HUD and Babylon Lite board with server snapshots, interpolation, local lane controls, launch, pause, restart, connection/full/retry/recovery states; verify focused client and input tests.
- [x] 2.4 Pin the verified released multiplayer client package and backend URL configuration; verify the lockfile and built browser bundle contain the exact package and no credentials.
- [x] 2.5 Replace README template copy with game instructions, exact local launch, multiplayer/hosting limits, art/gameplay references, original prompt, credits, and an original art sample; verify each documented command and link.

## 3. Integrated Verification and Delivery

- [x] 3.1 Run the app test suite and production build; verify GitHub Pages subpath assets and documented `npm install` / `npm run dev` launch.
- [x] 3.2 Verify the live WebGPU board, ball launch and brick scoring, shared lives, both seats, pointer lane control, keyboard pause/resume and local pause in two browser clients; verify victory, defeat and restart in deterministic game-rule tests. Exercise desktop rendering, narrow-layout fit tests, loaded assets, and browser console; note WebGPU requirement and that responsive sizing was verified with layout tests rather than a physical phone.
- [x] 3.3 Test two independent browser clients locally and run the live public integration suite for shared state, late join, disconnect/rejoin, capacity, replay and game isolation; verify the public protocol and document in-memory hosting limits.
- [x] 3.4 Commit and push scoped game changes, run the checked-in Pages/release workflows, and verify the deployed public game URL, asset loading, visible version, controls, and multiplayer connection.
- [x] 3.5 Synchronize both local checkouts with their release-generated commits and verify final OpenSpec status, repository status, and remote revision alignment.



