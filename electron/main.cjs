"use strict";

/**
 * LearnQuest desktop shell (Electron main process).
 *
 * Responsibilities:
 *   1. Serve the built game from dist/ over a private app:// protocol
 *      (so absolute URLs like /data/lessons/x.json keep working).
 *   2. Store save data as JSON files in a "saves" folder next to the game.
 *   3. Switch between windowed / borderless windowed / fullscreen.
 *   4. Ask the player to confirm before the game closes (X button, Alt+F4,
 *      Cmd+Q and the in-game QUIT button all go through the same prompt).
 */

const { app, BrowserWindow, ipcMain, protocol, net, screen, dialog, Menu } = require("electron");
const path = require("path");
const fs = require("fs");
const { pathToFileURL } = require("url");

const DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL || null;
const DIST_DIR = path.join(app.getAppPath(), "dist");
const PRELOAD_PATH = path.join(__dirname, "preload.cjs");
const APP_ORIGIN = "app://game";

const DISPLAY_MODES = new Set(["windowed", "borderless", "fullscreen"]);
const SAVE_NAMES = new Set(["progress", "settings"]);

protocol.registerSchemesAsPrivileged([
    {
        scheme: "app",
        privileges: {
            standard: true,
            secure: true,
            supportFetchAPI: true,
            corsEnabled: true,
            stream: true,
        },
    },
]);

// Let the menu music start without waiting for a click.
app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");

/* ------------------------------------------------------------------ */
/*  Save folder                                                        */
/* ------------------------------------------------------------------ */

let saveDir = null;

function isWritableDir(dir) {
    try {
        fs.mkdirSync(dir, { recursive: true });
        const probe = path.join(dir, ".write-test");
        fs.writeFileSync(probe, "ok");
        fs.unlinkSync(probe);
        return true;
    } catch {
        return false;
    }
}

/**
 * "saves" lives in the game's own folder:
 *   - dev:               <project>/saves
 *   - Windows portable:  next to the portable .exe
 *   - Linux AppImage:    next to the .AppImage
 *   - macOS .app:        next to the .app bundle
 *   - zip / unpacked:    next to the executable
 * If that location is read-only (e.g. Program Files), fall back to the
 * per-user data folder so the game still works.
 */
function resolveSaveDir() {
    let baseDir;

    if (!app.isPackaged) {
        baseDir = app.getAppPath();
    } else if (process.env.PORTABLE_EXECUTABLE_DIR) {
        baseDir = process.env.PORTABLE_EXECUTABLE_DIR;
    } else if (process.env.APPIMAGE) {
        baseDir = path.dirname(process.env.APPIMAGE);
    } else if (process.platform === "darwin") {
        baseDir = path.resolve(path.dirname(process.execPath), "..", "..", "..");
    } else {
        baseDir = path.dirname(process.execPath);
    }

    const preferred = path.join(baseDir, "saves");
    if (isWritableDir(preferred)) return preferred;

    const fallback = path.join(app.getPath("userData"), "saves");
    fs.mkdirSync(fallback, { recursive: true });
    console.warn(`[LearnQuest] ${preferred} is not writable, saving to ${fallback}`);
    return fallback;
}

function saveFile(name) {
    return path.join(saveDir, `${name}.json`);
}

function readSave(name) {
    if (!SAVE_NAMES.has(name)) return null;

    const file = saveFile(name);
    // Try the main file first, then the backup made before the last write.
    for (const candidate of [file, `${file}.bak`]) {
        try {
            const raw = fs.readFileSync(candidate, "utf8");
            JSON.parse(raw); // reject corrupt files
            return raw;
        } catch {
            /* try next candidate */
        }
    }
    return null;
}

function writeSave(name, text) {
    if (!SAVE_NAMES.has(name) || typeof text !== "string") return false;

    const file = saveFile(name);
    const tmp = `${file}.tmp`;

    try {
        JSON.parse(text);
        fs.mkdirSync(saveDir, { recursive: true });
        fs.writeFileSync(tmp, text, "utf8");
        if (fs.existsSync(file)) fs.copyFileSync(file, `${file}.bak`);
        fs.renameSync(tmp, file); // atomic swap: a crash can't leave a half-written save
        return true;
    } catch (error) {
        console.error(`[LearnQuest] Could not write ${name} save:`, error);
        return false;
    }
}

function persistDisplayMode(mode) {
    let settings = {};
    try {
        settings = JSON.parse(readSave("settings") || "{}");
    } catch {
        settings = {};
    }
    settings.displayMode = mode;
    writeSave("settings", JSON.stringify(settings));
}

/* ------------------------------------------------------------------ */
/*  Windows & display modes                                            */
/* ------------------------------------------------------------------ */

let mainWindow = null;
let currentMode = "windowed";
let quitting = false;

const closeAllowed = new WeakSet(); // windows we are closing on purpose
const promptReady = new WeakSet(); // webContents that can show the in-game prompt

function createWindow(mode, { display, skipIntro = false, openSettings = false } = {}) {
    const targetDisplay = display || screen.getPrimaryDisplay();
    const borderless = mode === "borderless";

    const options = {
        width: 1280,
        height: 720,
        useContentSize: true,
        minWidth: 640,
        minHeight: 360,
        show: false,
        title: "LearnQuest",
        backgroundColor: "#0b1020",
        autoHideMenuBar: true,
        frame: !borderless,
        fullscreen: mode === "fullscreen",
        webPreferences: {
            preload: PRELOAD_PATH,
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
            devTools: !app.isPackaged,
        },
    };

    if (borderless) {
        // A frameless window covering the whole display.
        Object.assign(options, {
            x: targetDisplay.bounds.x,
            y: targetDisplay.bounds.y,
            width: targetDisplay.bounds.width,
            height: targetDisplay.bounds.height,
            resizable: false,
            movable: false,
            hasShadow: false,
        });
    } else {
        // Open centred on the chosen display.
        const { x, y, width, height } = targetDisplay.workArea;
        options.x = Math.round(x + (width - 1280) / 2);
        options.y = Math.round(y + (height - 720) / 2);
    }

    const win = new BrowserWindow(options);

    win.on("close", (event) => {
        if (quitting || closeAllowed.has(win)) return;
        event.preventDefault();
        requestQuitPrompt(win);
    });

    win.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
    win.webContents.on("will-navigate", (event, url) => {
        if (!isTrustedUrl(url)) event.preventDefault();
    });

    win.webContents.on("before-input-event", (event, input) => {
        if (!app.isPackaged && input.type === "keyDown" && input.key === "F12") {
            win.webContents.toggleDevTools();
        }
    });

    // If the OS takes the window out of fullscreen (e.g. the macOS green button)
    // keep our idea of the current mode correct.
    win.on("leave-full-screen", () => {
        if (win === mainWindow && currentMode === "fullscreen") {
            currentMode = "windowed";
            persistDisplayMode(currentMode);
        }
    });
    win.on("enter-full-screen", () => {
        if (win === mainWindow && currentMode === "windowed") {
            currentMode = "fullscreen";
            persistDisplayMode(currentMode);
        }
    });

    win.once("ready-to-show", () => win.show());

    const query = new URLSearchParams();
    if (skipIntro) query.set("skipIntro", "1");
    if (openSettings) query.set("openSettings", "1");
    const queryString = query.toString() ? `?${query.toString()}` : "";

    if (DEV_SERVER_URL) {
        win.loadURL(`${DEV_SERVER_URL}${queryString}`);
    } else {
        win.loadURL(`${APP_ORIGIN}/index.html${queryString}`);
    }

    return win;
}

function isTrustedUrl(url) {
    return url.startsWith(APP_ORIGIN) || (DEV_SERVER_URL && url.startsWith(DEV_SERVER_URL));
}

function isTrustedSender(event) {
    const url = event.senderFrame?.url || event.sender.getURL();
    return isTrustedUrl(url);
}

/**
 * Windowed <-> fullscreen can happen in place. Borderless needs a different
 * window frame, which Electron can only set when a window is created, so
 * switching to/from borderless opens a fresh window and closes the old one.
 */
function applyDisplayMode(mode) {
    if (!DISPLAY_MODES.has(mode) || !mainWindow || mainWindow.isDestroyed()) return currentMode;
    if (mode === currentMode) return currentMode;

    const needsNewWindow = (currentMode === "borderless") !== (mode === "borderless");
    const previousWindow = mainWindow;

    currentMode = mode;
    persistDisplayMode(mode);

    if (needsNewWindow) {
        const display = screen.getDisplayMatching(previousWindow.getBounds());
        const nextWindow = createWindow(mode, { display, skipIntro: true, openSettings: true });
        mainWindow = nextWindow;

        nextWindow.once("show", () => {
            closeAllowed.add(previousWindow);
            if (!previousWindow.isDestroyed()) previousWindow.close();
        });
    } else {
        previousWindow.setFullScreen(mode === "fullscreen");
    }

    return currentMode;
}

/* ------------------------------------------------------------------ */
/*  Quit confirmation                                                  */
/* ------------------------------------------------------------------ */

let promptPending = false;
let promptTimer = null;

function quitNow() {
    quitting = true;
    clearTimeout(promptTimer);
    app.quit();
}

function nativeQuitConfirm(win) {
    // Used only while the game is still loading, or if the in-game prompt
    // fails to appear, so the X button can never get "stuck".
    const choice = dialog.showMessageBoxSync(win && !win.isDestroyed() ? win : undefined, {
        type: "question",
        buttons: ["Quit", "Cancel"],
        defaultId: 1,
        cancelId: 1,
        title: "Quit LearnQuest",
        message: "Are you sure you want to quit?",
        detail: "Your progress is saved automatically.",
    });
    promptPending = false;
    if (choice === 0) quitNow();
}

function requestQuitPrompt(win) {
    if (promptPending) return;
    if (!win || win.isDestroyed()) return quitNow();

    if (!promptReady.has(win.webContents)) {
        promptPending = true;
        return nativeQuitConfirm(win);
    }

    promptPending = true;
    win.webContents.send("quit:request");

    // If the game doesn't confirm it showed the prompt, fall back to a native one.
    clearTimeout(promptTimer);
    promptTimer = setTimeout(() => {
        if (promptPending) nativeQuitConfirm(win);
    }, 1500);
}

/* ------------------------------------------------------------------ */
/*  IPC                                                                */
/* ------------------------------------------------------------------ */

function registerIpc() {
    ipcMain.on("app:info", (event) => {
        event.returnValue = isTrustedSender(event)
            ? {
                  saveDir,
                  platform: process.platform,
                  version: app.getVersion(),
                  displayMode: currentMode,
              }
            : null;
    });

    ipcMain.on("display:get", (event) => {
        event.returnValue = currentMode;
    });

    ipcMain.handle("display:set", (event, mode) => {
        if (!isTrustedSender(event)) return currentMode;
        return applyDisplayMode(mode);
    });

    ipcMain.on("save:read", (event, name) => {
        event.returnValue = isTrustedSender(event) ? readSave(name) : null;
    });

    ipcMain.on("save:write", (event, name, text) => {
        event.returnValue = isTrustedSender(event) ? writeSave(name, text) : false;
    });

    ipcMain.on("quit:ready", (event) => {
        if (isTrustedSender(event)) promptReady.add(event.sender);
    });

    ipcMain.on("quit:shown", (event) => {
        if (isTrustedSender(event)) clearTimeout(promptTimer); // prompt is on screen
    });

    ipcMain.on("quit:cancel", (event) => {
        if (!isTrustedSender(event)) return;
        promptPending = false;
        clearTimeout(promptTimer);
    });

    ipcMain.on("quit:confirm", (event) => {
        if (isTrustedSender(event)) quitNow();
    });
}

/* ------------------------------------------------------------------ */
/*  App lifecycle                                                      */
/* ------------------------------------------------------------------ */

function registerAppProtocol() {
    protocol.handle("app", (request) => {
        const url = new URL(request.url);
        let relativePath = decodeURIComponent(url.pathname);
        if (relativePath === "/" || relativePath === "") relativePath = "/index.html";

        const filePath = path.normalize(path.join(DIST_DIR, relativePath));
        if (!filePath.startsWith(DIST_DIR + path.sep)) {
            return new Response("Forbidden", { status: 403 });
        }

        return net.fetch(pathToFileURL(filePath).toString());
    });
}

function buildMenu() {
    if (process.platform === "darwin") {
        Menu.setApplicationMenu(Menu.buildFromTemplate([{ role: "appMenu" }, { role: "windowMenu" }]));
    } else {
        Menu.setApplicationMenu(null);
    }
}

const gotLock = app.requestSingleInstanceLock();

if (!gotLock) {
    app.quit();
} else {
    app.on("second-instance", () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
        }
    });

    app.whenReady().then(() => {
        saveDir = resolveSaveDir();

        try {
            const savedMode = JSON.parse(readSave("settings") || "{}").displayMode;
            if (DISPLAY_MODES.has(savedMode)) currentMode = savedMode;
        } catch {
            /* keep default */
        }

        if (!DEV_SERVER_URL) registerAppProtocol();
        registerIpc();
        buildMenu();

        mainWindow = createWindow(currentMode);

        app.on("activate", () => {
            if (BrowserWindow.getAllWindows().length === 0) {
                mainWindow = createWindow(currentMode);
            }
        });
    });

    // macOS: Cmd+Q goes through the same confirmation.
    app.on("before-quit", (event) => {
        if (process.platform !== "darwin" || quitting) return;
        event.preventDefault();
        requestQuitPrompt(mainWindow);
    });

    app.on("window-all-closed", () => {
        if (process.platform !== "darwin") app.quit();
    });
}
