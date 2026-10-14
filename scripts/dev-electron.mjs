// Starts Vite, waits for it to respond, then opens LearnQuest in Electron.
// Run with: npm run desktop:dev

import { createServer } from "vite";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import electronPath from "electron";

const server = await createServer();

let child;

try {
    await server.listen();

    const url = server.resolvedUrls?.local?.[0];

    if (!url) {
        throw new Error("Could not determine the Vite dev server URL.");
    }

    // Verify that Vite responds before starting Electron.
    const deadline = Date.now() + 10_000;
    let ready = false;

    while (Date.now() < deadline) {
        try {
            const response = await fetch(url, {
                signal: AbortSignal.timeout(1_000),
            });

            if (response.ok) {
                ready = true;
                break;
            }
        } catch {
            // Vite may still be initializing. Retry shortly.
        }

        await delay(200);
    }

    if (!ready) {
        throw new Error(`Vite did not become ready at ${url}`);
    }

    console.log(`Vite is ready at ${url}`);
    console.log("Starting LearnQuest in Electron...");

    child = spawn(electronPath, ["."], {
        stdio: "inherit",
        env: {
            ...process.env,
            VITE_DEV_SERVER_URL: url,
        },
    });

    child.once("error", (error) => {
        console.error("Failed to start Electron:", error);
    });

    const exitCode = await new Promise((resolve, reject) => {
        child.once("error", reject);
        child.once("exit", (code, signal) => {
            if (signal) {
                reject(new Error(`Electron exited from signal ${signal}`));
            } else {
                resolve(code ?? 0);
            }
        });
    });

    process.exitCode = exitCode;
} catch (error) {
    console.error(error);
    process.exitCode = 1;
} finally {
    if (child && child.exitCode === null && !child.killed) {
        child.kill();
    }

    await server.close();
}