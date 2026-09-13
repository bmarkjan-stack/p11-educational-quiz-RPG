import Phaser from "phaser";

export default class PreloadScene extends Phaser.Scene {
    constructor() {
        super("PreloadScene");
    }

    preload() {
        // Main menu background
        this.load.image(
            "bg-main-menu",
            "assets/images/bg-main-menu.png"
        );

        // Character creation background
        this.load.image(
            "bg-character-creation",
            "assets/images/bg-character-creation.png"
        );
    }

    create() {
        this.scene.start("MenuScene");
    }
}