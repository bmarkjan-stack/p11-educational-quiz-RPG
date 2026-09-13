export default class PreloadScene extends Phaser.Scene {
    constructor() {
        super("PreloadScene");
    }

    preload() {
        this.load.image(
            "bg-main-menu",
            "assets/images/bg-main-menu.png"
        );
    }

    create() {
        this.scene.start("MenuScene");
    }
}