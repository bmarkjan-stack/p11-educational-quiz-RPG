import Phaser from "phaser";

export default class HealthBar {
    constructor(scene, x, y, width = 260, height = 24, maxHealth = 100) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.maxHealth = maxHealth;
        this.currentHealth = maxHealth;

        this.background = scene.add
            .rectangle(x, y, width, height, 0x111827, 1)
            .setStrokeStyle(2, 0x5f74bd)
            .setOrigin(0, 0.5);

        this.fill = scene.add
            .rectangle(x + 2, y, width - 4, height - 4, 0x22c55e, 1)
            .setOrigin(0, 0.5);

        this.label = scene.add
            .text(x + width / 2, y, `${maxHealth} / ${maxHealth}`, {
                fontFamily: "Arial",
                fontSize: "14px",
                fontStyle: "bold",
                color: "#ffffff",
            })
            .setOrigin(0.5);
    }

    setHealth(current, max = this.maxHealth) {
        this.currentHealth = Phaser.Math.Clamp(current, 0, max);
        this.maxHealth = max;

        const ratio = this.maxHealth === 0 ? 0 : this.currentHealth / this.maxHealth;
        const innerWidth = (this.width - 4) * ratio;

        this.fill.width = Math.max(innerWidth, 0);

        if (ratio <= 0.25) {
            this.fill.setFillStyle(0xef4444, 1);
        } else if (ratio <= 0.5) {
            this.fill.setFillStyle(0xf59e0b, 1);
        } else {
            this.fill.setFillStyle(0x22c55e, 1);
        }

        this.label.setText(`${this.currentHealth} / ${this.maxHealth}`);
    }

    destroy() {
        this.background.destroy();
        this.fill.destroy();
        this.label.destroy();
    }
}