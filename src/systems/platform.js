/**
 * Thin wrapper around the desktop shell (electron/preload.cjs).
 *
 * Inside the desktop app everything goes through `window.learnquest`.
 * In a plain browser (e.g. `npm run dev`) the same functions fall back to
 * localStorage / the Fullscreen API so the game still runs.
 */

const bridge = typeof window !== "undefined" ? window.learnquest : undefined;

export const isDesktop = Boolean(bridge?.isElectron);

/* ----------------------------- Save files ----------------------------- */

// "progress" -> localStorage key "learnquest-progress" (same key the game used before)
const browserKey = (name) => `learnquest-${name}`;

export function readSave(name) {
    try {
        if (isDesktop) return bridge.readSave(name);
        return localStorage.getItem(browserKey(name));
    } catch (error) {
        console.warn(`Could not read "${name}" save.`, error);
        return null;
    }
}

export function writeSave(name, text) {
    try {
        if (isDesktop) return bridge.writeSave(name, text) === true;
        localStorage.setItem(browserKey(name), text);
        return true;
    } catch (error) {
        console.warn(`Could not write "${name}" save.`, error);
        return false;
    }
}

export function getSaveLocation() {
    return isDesktop ? bridge.info?.saveDir ?? null : null;
}

/* ---------------------------- Display modes --------------------------- */

export const DISPLAY_MODE_OPTIONS = [
    { value: "windowed", label: "Windowed" },
    { value: "borderless", label: "Borderless Windowed" },
    { value: "fullscreen", label: "Fullscreen" },
];

/** Browsers can't do borderless windows, so that option is desktop-only. */
export function getAvailableDisplayModes() {
    return isDesktop
        ? DISPLAY_MODE_OPTIONS
        : DISPLAY_MODE_OPTIONS.filter((option) => option.value !== "borderless");
}

export function getDisplayMode() {
    if (isDesktop) return bridge.getDisplayMode();
    return document.fullscreenElement ? "fullscreen" : "windowed";
}

export async function setDisplayMode(mode) {
    if (isDesktop) return bridge.setDisplayMode(mode);

    try {
        if (mode === "fullscreen" && !document.fullscreenElement) {
            await document.documentElement.requestFullscreen();
        } else if (mode === "windowed" && document.fullscreenElement) {
            await document.exitFullscreen();
        }
    } catch (error) {
        console.warn("Display mode change was blocked by the browser.", error);
    }
    return getDisplayMode();
}

/* ------------------------------ Launch flags ------------------------------ */
/* Set by the desktop shell when it reopens the window for a display-mode switch. */

const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
const launchFlags = {
    skipIntro: params.get("skipIntro") === "1",
    openSettings: params.get("openSettings") === "1",
};

/** Returns true once, then false (so the flag only affects the first visit). */
export function consumeLaunchFlag(name) {
    const value = Boolean(launchFlags[name]);
    launchFlags[name] = false;
    return value;
}

/* -------------------------------- Quitting -------------------------------- */

export function onQuitRequest(callback) {
    return isDesktop ? bridge.onQuitRequest(callback) : () => {};
}

export const quitBridge = {
    ready: () => isDesktop && bridge.quitPromptReady(),
    shown: () => isDesktop && bridge.quitPromptShown(),
    cancel: () => isDesktop && bridge.cancelQuit(),
    confirm: () => isDesktop && bridge.confirmQuit(),
};
