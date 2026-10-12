import Phaser from "phaser";
import Button from "../ui/Button.js";
import { applyFloatyText } from "../ui/sceneEffects.js";

/**
 * Reusable modal "Are you sure?" prompt that sits on top of whatever scene is
 * running (and pauses it). Used by QUIT, the window close button, and RESET PROGRESS.
 *
 *   openConfirm(game, { title, message, confirmLabel, cancelLabel, onConfirm, onCancel, onShown })
 *
 * Pass cancelLabel: null for a single-button notice.
 */
export function openConfirm(game, options) {
    const manager = game.scene;
    const existing = manager.getScene("ConfirmScene");

    if (existing && manager.isActive("ConfirmScene")) {
        existing.forceClose();
        setTimeout(() => manager.run("ConfirmScene", options), 50);
        return;
    }

    manager.run("ConfirmScene", options);
}

export default class ConfirmScene extends Phaser.Scene {
    constructor() {
        super("ConfirmScene");
    }

    init(data) {
        this.options = {
            title: "Are you sure?",
            message: "",
            confirmLabel: "YES",
            cancelLabel: "NO",
            onConfirm: null,
            onCancel: null,
            onShown: null,
            ...data,
        };
        this.pausedScenes = [];
        this.closed = false;
    }

    create() {
        applyFloatyText(this);
        this.scene.bringToTop();

        // Freeze whatever is underneath so timers and input stop while asking.
        this.game.scene.getScenes(true).forEach((scene) => {
            if (scene !== this && scene.sys.isActive()) {
                this.pausedScenes.push(scene.sys.settings.key);
                scene.scene.pause();
            }
        });

        // Dim + block clicks
        this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.7).setInteractive().setDepth(0);
        this.add.image(640, 360, "result-panel").setOrigin(0.5).setDepth(1);

        this.add
            .text(640, 235, this.options.title, {
                fontFamily: "LearnQuest",
                fontSize: "32px",
                fontStyle: "bold",
                color: "#ffffff",
            })
            .setOrigin(0.5)
            .setDepth(2);

        this.add
            .text(640, 335, this.options.message, {
                fontFamily: "LearnQuest",
                fontSize: "22px",
                color: "#e2e8f0",
                align: "center",
                wordWrap: { width: 640 },
            })
            .setOrigin(0.5)
            .setDepth(2);

        const hasCancel = this.options.cancelLabel !== null;
        const buttonY = 450;

        if (hasCancel) {
            // Cancel is on the left, away from the "danger" action; keyboard Esc also cancels.
            new Button(this, 490, buttonY, this.options.cancelLabel, () => this.finish("onCancel"), { width: 240 })
                .setDepth(3);
            new Button(this, 790, buttonY, this.options.confirmLabel, () => this.finish("onConfirm"), { width: 240 })
                .setDepth(3);
        } else {
            new Button(this, 640, buttonY, this.options.confirmLabel, () => this.finish("onConfirm"), { width: 240 })
                .setDepth(3);
        }

        this.input.keyboard?.on("keydown-ESC", () => this.finish(hasCancel ? "onCancel" : "onConfirm"));

        this.options.onShown?.();
    }

    resumePausedScenes() {
        this.pausedScenes.forEach((key) => {
            if (this.game.scene.isPaused(key)) this.game.scene.resume(key);
        });
        this.pausedScenes = [];
    }

    /** Close without calling any callback (used when another prompt replaces this one). */
    forceClose() {
        if (this.closed) return;
        this.closed = true;
        this.resumePausedScenes();
        this.scene.stop();
    }

    finish(callbackName) {
        if (this.closed) return;
        this.closed = true;

        const callback = this.options[callbackName];
        this.resumePausedScenes();
        this.scene.stop();
        callback?.();
    }
}
