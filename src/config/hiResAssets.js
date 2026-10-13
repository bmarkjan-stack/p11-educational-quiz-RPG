/**
 * HIGH-RESOLUTION ASSET PLACEHOLDER
 * ---------------------------------
 * The game is designed on a 1280x720 canvas. Fullscreen on a 1080p / 1440p /
 * 4K monitor stretches that canvas, so art authored at 1x gets soft.
 *
 * When you have 2x art (see assets/images-hd/README.md for the list and sizes):
 *   1. Drop each file into assets/images-hd/ using the SAME relative path as
 *      the original (e.g. assets/images/ui/button-normal.png ->
 *      assets/images-hd/ui/button-normal.png).
 *   2. Add that relative path (below "images/") to HI_RES_FILES.
 *
 * Nothing changes until HI_RES_FILES has entries, so this is safe to ship empty.
 *
 * IMPORTANT: assets the code draws with setDisplaySize() (backgrounds, buttons,
 * panels, quiz options) swap in cleanly. Assets drawn at their natural size or
 * with setScale() (characters, enemies, title) also need a small scale tweak in
 * their scene when swapped - ask for that pass when you deliver them.
 */

export const HI_RES_SCALE = 2; // hi-res files are 2x the original pixel size

// Only use hi-res art when the screen is clearly bigger than the 720p design size.
export const HI_RES_MIN_SCREEN_HEIGHT = 1080;

// e.g. "ui/button-normal.png", "background/bg-main-menu.png"
export const HI_RES_FILES = new Set([
    // (empty - waiting for hi-res assets)
]);

const IMAGE_PREFIX = "assets/images/";
const HD_PREFIX = "assets/images-hd/";

function shouldUseHiRes() {
    if (HI_RES_FILES.size === 0) return false;
    const screenHeight = (window.screen?.height ?? 0) * (window.devicePixelRatio || 1);
    return screenHeight >= HI_RES_MIN_SCREEN_HEIGHT;
}

/**
 * Wraps loader.image() so a registered hi-res file is loaded instead of the
 * 1x one. Call once at the start of PreloadScene.preload().
 */
export function enableHiResImages(loader) {
    if (!shouldUseHiRes()) return;

    const loadImage = loader.image.bind(loader);
    loader.image = (key, url, ...rest) => {
        if (typeof url === "string" && url.startsWith(IMAGE_PREFIX)) {
            const relative = url.slice(IMAGE_PREFIX.length);
            if (HI_RES_FILES.has(relative)) {
                return loadImage(key, `${HD_PREFIX}${relative}`, ...rest);
            }
        }
        return loadImage(key, url, ...rest);
    };
}
