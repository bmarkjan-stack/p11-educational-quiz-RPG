import Phaser from "phaser";

export default class ExperienceBar {
    constructor(scene, x, y, width = 260, height = 14, current = 0, required = 10) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.current = 0;
        this.required = required;

        this.background = scene.add
            .rectangle(x, y, width, height, 0x111827, 1)
            .setStrokeStyle(2, 0x5f74bd)
            .setOrigin(0, 0.5);

        this.fill = scene.add
            .rectangle(x + 2, y, width - 4, height - 4, 0xfacc15, 1)
            .setOrigin(0, 0.5);

        this.label = scene.add
            .text(x + width / 2, y, `${current} / ${required} XP`, {
                fontFamily: "Arial",
                fontSize: "11px",
                fontStyle: "bold",
                color: "#ffffff",
            })
            .setOrigin(0.5);

        this.setExperience(current, required);
    }

    setExperience(current, required = this.required) {
        this.required = Math.max(1, required);
        this.current = Phaser.Math.Clamp(current, 0, this.required);

        const ratio = this.current / this.required;
        this.fill.width = Math.max((this.width - 4) * ratio, 0);
        this.label.setText(`${this.current} / ${this.required} XP`);
    }

    destroy() {
        this.background.destroy();
        this.fill.destroy();
        this.label.destroy();
    }
}