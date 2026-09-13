import Phaser from "phaser";

export default class MenuScene extends Phaser.Scene {
    constructor() {
        super("MenuScene");
    }

    create() {
        this.drawBackground();
    }

    drawBackground() {
        const background = this.add.image(
            640,
            360,
            "bg-main-menu"
        );

        background.setDisplaySize(1280, 720);
    }
}
