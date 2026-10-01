# Neon Breaker Duo layout and renderer

The game uses a 320×576 logical playfield, matching the portrait 9:16 stage. React owns the HUD and controls; Babylon Lite renders the shared board through a nearest-sampled sprite atlas. The original background is scaled to fill the stage. The canvas stays transparent so that background remains visible.

## Pixel-art rendering

There are four separate sizes in this pipeline:

- **Logical scene:** 320×576 game units, used for sprite positions, sizes, and camera framing.
- **Internal render target:** selected with the `(R)` control or R key from quarter, half, native, or double the native backing size. For example, a 640×1152 native backing gives 160×288, 320×576, 640×1152, and 1280×2304 targets.
- **Canvas backing:** the viewport's CSS dimensions multiplied by device pixel ratio. Babylon Lite owns the canvas at this native DPR-aware size.
- **CSS display:** the responsive portrait viewport measured in CSS pixels, which may be scaled to fit the browser window.

`src/content/babylon/config.js` pins the Babylon Lite WebGPU engine to one sample, enables premultiplied alpha, and loads textures with nearest minification/magnification and no mipmaps. `src/content/Content.jsx` renders the logical scene to the selected internal target, maps logical center `(160, 288)` to that target's center, then presents it at the native canvas backing size using nearest-neighbor sampling. Resize and device-pixel-ratio changes recalculate dimensions; stale GPU resources are disposed before replacement. Upscaled targets are capped to the WebGPU device texture limit while preserving their aspect ratio, and the UI reports the resulting dimensions. A target allocation failure displays a recovery message while retaining the WebGPU-only path. Sprite positions and sizes remain in logical playfield coordinates.

The HUD shows a compact render-resolution button below the game title. Its accessible label and Babylon Lite dialog show the active dimensions; Native is labeled explicitly. Clicking the control or pressing **R** cycles quarter → half → native → double → quarter. The preset is stored with the other local settings and recalculated after viewport or DPR changes.

The game uses one responsive portrait 9:16 viewport (`src/ui/layout.js`) so both players can move across the full shared playfield. Their paddles may overlap horizontally; Player 1's center is y=490 and Player 2's is y=440. There is no orientation toggle. The UI remains in React and stays reachable over the playfield. **O** opens settings; **P** pauses only the local display/input, leaving the shared server match active. The app requires WebGPU. If WebGPU is unavailable, the page displays an explanation and keeps the surrounding UI available.

## Running and testing

From the repository root:

```powershell
npm install
$env:VITE_MULTIPLAYER_URL = "https://rmc-colyseus-multiplayer-server.vercel.app"
npm run dev
```

Open the printed address in two browser sessions to play together. Run `npm test` and `npm run build` for local checks. The Vite base path is `/babylon-lite-arkanoid-clone/`, matching the GitHub Pages project site.

## Art provenance

`src/content/babylon/images/neon-brick-atlas.png` is generated reproducibly by `documentation/generate-neon-atlas.mjs`. `documentation/neon-space-background.png` was generated for this project. The gameplay reference is the paddle-and-ball brick breaking structure of *Arkanoid: Revenge of Doh*; no original game's assets or code are included.
