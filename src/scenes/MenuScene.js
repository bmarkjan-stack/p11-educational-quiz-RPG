import Phaser from "phaser";
import Button from "../ui/Button.js";
import ProgressManager from "../systems/ProgressManager.js";
import { applyFloatyText } from "../ui/sceneEffects.js";
import Slider from "../ui/Slider.js";
import Dropdown from "../ui/Dropdown.js";
import { openConfirm } from "./ConfirmScene.js";
import { requestQuit } from "../systems/QuitFlow.js";
import { playSfx, refreshMusicVolume } from "../systems/AudioManager.js";
import {
    getMusicVolume,
    getSfxVolume,
    setMusicVolume,
    setSfxVolume,
    saveSettings,
    changeDisplayMode,
    getDisplayMode,
} from "../systems/SettingsManager.js";
import { getAvailableDisplayModes, getSaveLocation, consumeLaunchFlag } from "../systems/platform.js";

export default class MenuScene extends Phaser.Scene {
    constructor() {
        super("MenuScene");
    }

    create() {
        applyFloatyText(this);
        this.drawBackground();
        this.createTitle();
        this.createButtons();

        // Reopened by the desktop shell after a display-mode switch that needed a new window.
        if (consumeLaunchFlag("openSettings")) {
            this.showSettings();
        }
    }

    drawBackground() {
        this.add.image(640, 360, "bg-main-menu").setDisplaySize(1280, 720);
    }

    createTitle() {
        this.add
            .image(640, 270, "game-title")
            .setOrigin(0.5)
            .setScale(0.7);
    }

    createButtons() {
        const progressManager = new ProgressManager();
        const savedCharacter = progressManager.getCharacter();
        const hasCharacter = Boolean(savedCharacter.character);

        // New Game
        this.newGameButton = new Button(this, 640, 410, "NEW GAME", () => {
            this.scene.start("CharacterSelectScene");
        });
        this.newGameButton.setEnabled(!hasCharacter);

        // Continue
        this.continueButton = new Button(this, 640, 470, "CONTINUE", () => {
            this.scene.start("LessonSelectScene", {
                character: savedCharacter.character,
                characterName: savedCharacter.characterName,
            });
        });
        this.continueButton.setEnabled(hasCharacter);

        new Button(this, 640, 530, "SETTINGS", () => {
            this.showSettings();
        });

        new Button(this, 640, 590, "ABOUT", () => {
            this.showAbout();
        });

        new Button(this, 640, 650, "QUIT", () => {
            this.showQuit();
        });
    }

    showSettings() {
        if (this.settingsUi) return;

        const ui = [];
        this.settingsUi = ui;

        const closeSettings = () => {
            ui.forEach((item) => item.destroy());
            this.settingsUi = null;
        };

        const labelStyle = {
            fontFamily: "LearnQuest",
            fontSize: "22px",
            color: "#e2e8f0",
        };

        ui.push(this.add.image(640, 360, "result-panel").setOrigin(0.5).setDepth(10));

        ui.push(
            this.add
                .text(640, 182, "SETTINGS", {
                    fontFamily: "LearnQuest",
                    fontSize: "30px",
                    fontStyle: "bold",
                    color: "#ffffff",
                })
                .setOrigin(0.5)
                .setDepth(11)
        );

        // --- Music volume ---
        ui.push(this.add.text(320, 250, "MUSIC", labelStyle).setOrigin(0, 0.5).setDepth(11));
        ui.push(
            new Slider(this, {
                x: 590,
                y: 250,
                width: 300,
                value: getMusicVolume(),
                onChange: (value) => {
                    setMusicVolume(value);
                    refreshMusicVolume(this); // hear the change immediately
                },
                onRelease: () => saveSettings(),
            })
        );

        // --- Sound effects volume ---
        ui.push(this.add.text(320, 315, "SOUND EFFECTS", labelStyle).setOrigin(0, 0.5).setDepth(11));
        ui.push(
            new Slider(this, {
                x: 590,
                y: 315,
                width: 300,
                value: getSfxVolume(),
                onChange: (value) => setSfxVolume(value),
                onRelease: () => {
                    saveSettings();
                    playSfx(this, "sfx-correct", { volume: 0.6 }); // preview at the new level
                },
            })
        );

        // --- Display mode ---
        ui.push(this.add.text(320, 380, "DISPLAY", labelStyle).setOrigin(0, 0.5).setDepth(11));
        ui.push(
            new Dropdown(this, {
                x: 740,
                y: 380,
                width: 300,
                options: getAvailableDisplayModes(),
                value: getDisplayMode(),
                onChange: (mode) => changeDisplayMode(mode),
            })
        );

        // --- Buttons ---
        const resetButton = new Button(
            this,
            470,
            465,
            "RESET PROGRESS",
            () => {
                openConfirm(this.game, {
                    title: "RESET PROGRESS?",
                    message: "Are you sure you want to reset all progress?\n\nThis cannot be undone.",
                    confirmLabel: "RESET",
                    cancelLabel: "CANCEL",
                    onConfirm: () => {
                        new ProgressManager().resetProgress();
                        // Rebuild the menu so CONTINUE becomes disabled.
                        this.scene.restart();
                    },
                });
            },
            { width: 260 }
        );
        resetButton.setDepth(11);
        ui.push(resetButton);

        const closeButton = new Button(this, 810, 465, "CLOSE", closeSettings, { width: 200 });
        closeButton.setDepth(11);
        ui.push(closeButton);

        // Where the save file lives (desktop app only)
        const saveLocation = getSaveLocation();
        if (saveLocation) {
            ui.push(
                this.add
                    .text(640, 535, `Saves folder: ${shortenPath(saveLocation, 64)}`, {
                        fontFamily: "LearnQuest",
                        fontSize: "14px",
                        color: "#94a3b8",
                        align: "center",
                    })
                    .setOrigin(0.5)
                    .setDepth(11)
            );
        }
    }

    showAbout() {
        const overlay = this.add
            .image(640, 360, "result-panel")
            .setOrigin(0.5)
            .setDepth(10);

        const text = this.add
            .text(
                640,
                310,
                "LearnQuest is an educational quiz RPG.\n\nAnswer questions correctly to defeat bosses\n\nand master JavaScript, Python, and SQL!",
                {
                    fontFamily: "LearnQuest",
                    fontSize: "22px",
                    color: "#e2e8f0",
                    align: "center",
                }
            )
            .setOrigin(0.5)
            .setDepth(11);

        const closeButton = new Button(this, 640, 445, "CLOSE", () => {
            overlay.destroy();
            text.destroy();
            closeButton.destroy();
        });

        closeButton.setDepth(11);
    }

    showQuit() {
        requestQuit(this.game);
    }
}

function shortenPath(value, maxLength) {
    if (value.length <= maxLength) return value;
    const keep = Math.floor((maxLength - 3) / 2);
    return `${value.slice(0, keep)}...${value.slice(-keep)}`;
}
