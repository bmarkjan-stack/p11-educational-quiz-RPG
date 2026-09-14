import Phaser from "phaser";
import Button from "../ui/Button.js";

export default class PreloadScene extends Phaser.Scene {
    constructor() {
        super("PreloadScene");
    }

    preload() {
        this.createLoadingBar();

        // Backgrounds
        this.load.image("bg-main-menu", "assets/images/background/bg-main-menu.png");
        this.load.image("bg-character-creation", "assets/images/background/bg-character-creation.png");

        // Characters & bosses
        this.load.image("player-male", "assets/images/characters/male/player-male.png");
        this.load.image("player-female", "assets/images/characters/female/player-female.png");
        this.load.image("boss1-slime", "assets/images/characters/enemies/boss1-slime.png");
        this.load.image("final-boss-dragon", "assets/images/characters/enemies/final-boss-dragon.png");

        // Music
        this.load.audio(
            "bgm-menu",
            encodeURI("assets/audio/Music/Main Menu - Rising Sun - DivKid.mp3")
        );

        // UI
        this.load.image("button-normal", "assets/images/ui/button-normal.png");
        this.load.image("button-hover", "assets/images/ui/button-hover.png");
        this.load.image("button-active", "assets/images/ui/button-active.png");
    }

    createLoadingBar() {
        const { width, height } = this.scale;

        // Background
        this.add .image(width / 2, height / 2, "preload-background") .setDisplaySize(width, height);

        // Title
        this.add .image(width / 2, height / 2, "game-title") .setOrigin(0.5);

        // Loading Text
        const loadingLabel = this.add .text(width / 2, height - 145, "Loading...", { fontFamily: "LearnQuest", fontSize: "24px", fontStyle: "bold", color: "#ffffff", }) .setOrigin(0.5);

        // Progress Bar Background
        const box = this.add .rectangle( width / 2, height - 100, 420, 36, 0x111827, 0.9 ) .setStrokeStyle(2, 0x5f74bd);

        // Progress Bar 
        const bar = this.add .rectangle( width / 2 - 205, height - 100, 10, 26, 0x5f74bd, 1 ) .setOrigin(0, 0.5);

        // Loading Percentage
        const percentageLabel = this.add .text(width / 2, height - 55, "0%", { fontFamily: "LearnQuest", fontSize: "18px", color: "#c7d2fe", }) .setOrigin(0.5);

        // Loading Progress 
        this.load.on("progress", (value) => { bar.width = 410 * value; percentageLabel.setText( `${Math.floor(value * 100)}%` ); });

        // Loading Complete
        this.load.on("complete", () => { loadingLabel.destroy(); box.destroy(); bar.destroy(); percentageLabel.destroy(); });
    }

    create() {
        this.createContinueButton();
    }

    createContinueButton() {
        const { width, height } = this.scale;

        this.continueButton = new Button(
            this,
            width / 2,
            height - 80,
            "PRESS TO CONTINUE",
            () => {
                this.scene.start("MenuScene");
            },
            {
                width: 300,
                height: 64,
                fontFamily: "LearnQuest",
                fontSize: "20px",
            }
        );

        this.continueButton.setDepth(10);
    }
}