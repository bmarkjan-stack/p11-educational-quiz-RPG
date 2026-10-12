import { openConfirm } from "../scenes/ConfirmScene.js";
import { isDesktop, quitBridge } from "./platform.js";

/**
 * One quit flow for every entry point: the QUIT menu button, the window's
 * X button, Alt+F4 and Cmd+Q. Each of them ends up here.
 */
export function requestQuit(game) {
    openConfirm(game, {
        title: "QUIT GAME?",
        message: "Are you sure you want to quit?\n\nYour progress is saved automatically.",
        confirmLabel: "QUIT",
        cancelLabel: "STAY",
        onShown: () => quitBridge.shown(),
        onCancel: () => quitBridge.cancel(),
        onConfirm: () => {
            if (isDesktop) {
                quitBridge.confirm();
                return;
            }

            // Browsers only let a page close itself if a script opened it.
            window.close();
            setTimeout(() => {
                openConfirm(game, {
                    title: "THANKS FOR PLAYING!",
                    message: "Your browser won't let the game close itself.\nYou can close this tab now.",
                    confirmLabel: "OK",
                    cancelLabel: null,
                });
            }, 100);
        },
    });
}
