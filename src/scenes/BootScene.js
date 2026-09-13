import Phaser from "phaser";

export default class BootScene extends Phaser.Scene {
    constructor() {
        super("BootScene");
    }

    create() {
        this.cameras.main.setBackgroundColor("#0b1020");

        this.add
            .text(640, 310, "LEARNQUEST", {
                fontFamily: "Arial",
                fontSize: "64px",
                fontStyle: "bold",
                color: "#ffffff",
            })
            .setOrigin(0.5);

        this.add
            .text(640, 385, "Educational Quiz RPG", {
                fontFamily: "Arial",
                fontSize: "24px",
                color: "#a8b3cf",
            })
            .setOrigin(0.5);

        this.time.delayedCall(500, () => {
            this.scene.start("PreloadScene");
        });
    }
}
