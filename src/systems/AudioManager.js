import { getMusicVolume, getSfxVolume } from "./SettingsManager.js";

/**
 * All game audio goes through these helpers so the MUSIC and SOUND EFFECTS
 * sliders in Settings apply everywhere.
 *
 * `volume` is the track's own mix level (what used to be hard-coded in each
 * scene). The final volume is  mix level x slider value.
 */

const MUSIC = "music";
const SFX = "sfx";

function tag(sound, channel, baseVolume) {
    sound.lqChannel = channel;
    sound.lqBaseVolume = baseVolume;
    return sound;
}

/** Plays a music track (replacing any copy of the same track already playing). */
export function playMusic(scene, key, { loop = false, volume = 1 } = {}) {
    const manager = scene.sound;

    manager.getAll(key).forEach((existing) => {
        existing.stop();
        existing.destroy();
    });

    const sound = tag(
        manager.add(key, { loop, volume: volume * getMusicVolume() }),
        MUSIC,
        volume
    );

    if (!loop) sound.once("complete", () => sound.destroy());
    sound.play();
    return sound;
}

/** Plays a one-shot sound effect. */
export function playSfx(scene, key, { volume = 1 } = {}) {
    const sound = tag(scene.sound.add(key, { volume: volume * getSfxVolume() }), SFX, volume);
    sound.once("complete", () => sound.destroy());
    sound.play();
    return sound;
}

/** Re-applies the music slider to whatever is playing right now. */
export function refreshMusicVolume(scene) {
    scene.sound.sounds.forEach((sound) => {
        if (sound.lqChannel === MUSIC) {
            sound.setVolume((sound.lqBaseVolume ?? 1) * getMusicVolume());
        }
    });
}
