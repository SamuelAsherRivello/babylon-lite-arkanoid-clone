import { isRenderResolutionPreset } from "../content/babylon/render-resolution.js";

export const configStorageKey = "neon-breaker-duo.config";
export const fullscreenStorageKey = "neon-breaker-duo.fullscreen";
export const defaultConfig = Object.freeze({ fullscreen: false, hudVisible: true, renderPreset: "native" });

export function readConfig(storage = globalThis.localStorage) {
  try {
    const saved = JSON.parse(storage.getItem(configStorageKey) ?? "null");
    return {
      fullscreen: typeof saved?.fullscreen === "boolean"
        ? saved.fullscreen
        : storage.getItem(fullscreenStorageKey) === "true",
      hudVisible: typeof saved?.hudVisible === "boolean" ? saved.hudVisible : defaultConfig.hudVisible,
      renderPreset: isRenderResolutionPreset(saved?.renderPreset) ? saved.renderPreset : defaultConfig.renderPreset,
    };
  } catch {
    return defaultConfig;
  }
}

export function persistConfig(config, storage = globalThis.localStorage) {
  try {
    storage.setItem(configStorageKey, JSON.stringify(config));
    storage.setItem(fullscreenStorageKey, config.fullscreen ? "true" : "false");
    return true;
  } catch {
    return false;
  }
}
