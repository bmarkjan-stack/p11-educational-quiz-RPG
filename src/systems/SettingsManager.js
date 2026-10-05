import { readSave, writeSave, getDisplayMode, setDisplayMode as applyDisplayMode } from "./platform.js";

/**
 * Player preferences (volume + display mode), stored in the "settings" save
 * file next to the game. Kept in memory so every scene sees the same values.
 */

const DEFAULTS = {
    musicVolume: 1, // 0..1 – multiplies each music track's own mix level
    sfxVolume: 1, // 0..1 – multiplies each sound effect's own mix level
};

const clamp01 = (value) => Math.min(1, Math.max(0, Number.isFinite(value) ? value : 1));

function load() {
    try {
        const raw = readSave("settings");
        const parsed = raw ? JSON.parse(raw) : {};
        return {
            musicVolume: clamp01(parsed.musicVolume ?? DEFAULTS.musicVolume),
            sfxVolume: clamp01(parsed.sfxVolume ?? DEFAULTS.sfxVolume),
        };
    } catch (error) {
        console.warn("Could not load settings, using defaults.", error);
        return { ...DEFAULTS };
    }
}

const settings = load();

export function getMusicVolume() {
    return settings.musicVolume;
}

export function getSfxVolume() {
    return settings.sfxVolume;
}

/** Update in memory (call during slider drags); persist with saveSettings(). */
export function setMusicVolume(value) {
    settings.musicVolume = clamp01(value);
}

export function setSfxVolume(value) {
    settings.sfxVolume = clamp01(value);
}

export function saveSettings() {
    writeSave(
        "settings",
        JSON.stringify({
            musicVolume: settings.musicVolume,
            sfxVolume: settings.sfxVolume,
            displayMode: getDisplayMode(),
        })
    );
}

export async function changeDisplayMode(mode) {
    const applied = await applyDisplayMode(mode);
    saveSettings();
    return applied;
}

export { getDisplayMode };