import Phaser from "phaser";
import Button from "../ui/Button.js";

export default class MenuScene extends Phaser.Scene {
    constructor() {
        super("MenuScene");
    }

    create() {
        this.drawBackground();
        this.createTitle();
        this.createButtons();
        this.playMusic();
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
        new Button(this, 640, 410, "NEW GAME", () => {
            this.sound.stopAll();
            this.scene.start("CharacterSelectScene");
        });

        new Button(this, 640, 470, "CONTINUE", () => {
            this.showAbout();
        });

        new Button(this, 640, 530, "SETTINGS", () => {
            this.showAbout();
        });

        new Button(this, 640, 590, "ABOUT", () => {
            this.showAbout();
        });

        new Button(this, 640, 650, "QUIT", () => {
            this.showAbout();
        });
    }

    playMusic() {
        if (!this.sound.get("bgm-menu")) {
            this.sound.play("bgm-menu", { loop: true, volume: 0.4 });
        }
    }

    showAbout() {
        const overlay = this.add
            .rectangle(640, 360, 700, 260, 0x070b18, 0.97)
            .setStrokeStyle(2, 0x5f74bd)
            .setDepth(10);

        const text = this.add
            .text(
                640,
                340,
                "LearnQuest is an educational quiz RPG.\nAnswer questions correctly to defeat bosses\nand master JavaScript, Python, and SQL!",
                {
                    fontFamily: "LearnQuest",
                    fontSize: "18px",
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
}
