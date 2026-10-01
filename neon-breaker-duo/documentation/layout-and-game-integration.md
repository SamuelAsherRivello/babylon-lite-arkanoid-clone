# Neon Breaker Duo layout and renderer

The game uses a 320×576 logical playfield, matching the portrait 9:16 stage. React owns the HUD and controls; Babylon Lite renders the shared board through a nearest-sampled sprite atlas. The original background is scaled to fill the stage. The canvas stays transparent so that background remains visible.

## Pixel-art rendering

`src/content/babylon/config.js` pins the Babylon Lite WebGPU engine to one sample, enables premultiplied alpha, and loads textures with nearest minification/magnification and no mipmaps. `src/content/Content.jsx` creates an internal render target from the available device-pixel dimensions, maps the logical center `(160, 288)` to the center of that target, and presents the target at native canvas dimensions. Resizing and device-pixel-ratio changes rebuild the target. Sprite positions and sizes use logical playfield coordinates.

The default responsive viewport is portrait 9:16 (`src/ui/layout.js`). The UI remains in React and stays reachable over the playfield. **O** opens orientation settings; **P** pauses only the local display/input, leaving the shared server match active. The app requires WebGPU. If WebGPU is unavailable, the page displays an explanation and keeps the surrounding UI available.

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
