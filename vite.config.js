import { defineConfig } from "vite";
import { cpSync, existsSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Vite only copies public/ into dist/. The game's images and audio live in
 * assets/, so copy them too - otherwise a production build (web or desktop)
 * would be missing all artwork and sound.
 * (Fonts are bundled by Vite through styles.css, so they aren't copied here.)
 */
function copyGameAssets() {
    const folders = ["images", "images-hd", "audio"];
    let outDir = "dist";

    return {
        name: "copy-game-assets",
        apply: "build",
        configResolved(config) {
            outDir = resolve(config.root, config.build.outDir);
        },
        closeBundle() {
            for (const folder of folders) {
                const from = resolve("assets", folder);
                if (existsSync(from)) {
                    cpSync(from, resolve(outDir, "assets", folder), { recursive: true });
                }
            }
        },
    };
}

export default defineConfig({
    plugins: [copyGameAssets()],
    build: {
        target: "es2022", // top-level await is used in main.js
    },
});
