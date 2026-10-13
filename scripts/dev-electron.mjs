// Starts the Vite dev server, then opens the game in the Electron window.
// Run with:  npm run desktop:dev
import { createServer } from "vite";
import { spawn } from "node:child_process";
import electronPath from "electron";

const server = await createServer();
await server.listen();

const url = server.resolvedUrls?.local?.[0];
if (!url) {
    console.error("Could not determine the Vite dev server URL.");
    await server.close();
    process.exit(1);
}

const child = spawn(electronPath, ["."], {
    stdio: "inherit",
    env: { ...process.env, VITE_DEV_SERVER_URL: url },
});

child.on("exit", async (code) => {
    await server.close();
    process.exit(code ?? 0);
});
