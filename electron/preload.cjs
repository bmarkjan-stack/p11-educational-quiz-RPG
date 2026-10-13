"use strict";

const { contextBridge, ipcRenderer } = require("electron");

// The only things the game page is allowed to ask the desktop shell for.
contextBridge.exposeInMainWorld("learnquest", {
    isElectron: true,
    info: ipcRenderer.sendSync("app:info"),

    // Save files ("progress" and "settings"), stored in the game's saves folder.
    readSave: (name) => ipcRenderer.sendSync("save:read", name),
    writeSave: (name, text) => ipcRenderer.sendSync("save:write", name, text),

    // Display mode: "windowed" | "borderless" | "fullscreen"
    getDisplayMode: () => ipcRenderer.sendSync("display:get"),
    setDisplayMode: (mode) => ipcRenderer.invoke("display:set", mode),

    // Quit flow
    onQuitRequest: (callback) => {
        const listener = () => callback();
        ipcRenderer.on("quit:request", listener);
        return () => ipcRenderer.removeListener("quit:request", listener);
    },
    quitPromptReady: () => ipcRenderer.send("quit:ready"),
    quitPromptShown: () => ipcRenderer.send("quit:shown"),
    cancelQuit: () => ipcRenderer.send("quit:cancel"),
    confirmQuit: () => ipcRenderer.send("quit:confirm"),
});
