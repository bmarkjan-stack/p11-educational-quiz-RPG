import Phaser from "phaser";

/**
 * Horizontal 0..1 slider drawn with Phaser shapes.
 * Drag the handle or click anywhere on the track.
 */
export default class Slider {
    constructor(scene, { x, y, width = 300, value = 1, onChange, onRelease, depth = 11 }) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.width = width;
        this.value = value;
        this.onChange = onChange;
        this.onRelease = onRelease;
        this.dragging = false;

        this.track = scene.add.rectangle(x, y, width, 10, 0x111827, 1)
            .setOrigin(0, 0.5)
            .setStrokeStyle(2, 0x5f74bd);
        this.fill = scene.add.rectangle(x, y, width * value, 10, 0x5f74bd, 1).setOrigin(0, 0.5);
        this.handle = scene.add.circle(x + width * value, y, 14, 0xfacc15, 1).setStrokeStyle(3, 0x1f2937);

        this.valueText = scene.add
            .text(x + width + 40, y, "", {
                fontFamily: "LearnQuest",
                fontSize: "20px",
                color: "#ffffff",
            })
            .setOrigin(0, 0.5);

        // Generous invisible hit area so the thin track is easy to grab.
        this.hitArea = scene.add.rectangle(x + width / 2, y, width + 36, 44, 0xffffff, 0)
            .setInteractive({ useHandCursor: true });

        this.hitArea.on("pointerdown", (pointer) => {
            this.dragging = true;
            this.updateFromPointer(pointer);
        });

        this.onMove = (pointer) => {
            if (this.dragging) this.updateFromPointer(pointer);
        };
        this.onUp = () => {
            if (!this.dragging) return;
            this.dragging = false;
            this.onRelease?.(this.value);
        };

        scene.input.on("pointermove", this.onMove);
        scene.input.on("pointerup", this.onUp);
        scene.input.on("pointerupoutside", this.onUp);

        this.parts = [this.track, this.fill, this.handle, this.valueText, this.hitArea];
        this.render();
        this.setDepth(depth);
    }

    updateFromPointer(pointer) {
        const ratio = Phaser.Math.Clamp((pointer.x - this.x) / this.width, 0, 1);
        // Snap to whole percentages and make the ends easy to hit.
        this.value = Math.round(ratio * 100) / 100;
        this.render();
        this.onChange?.(this.value);
    }

    render() {
        this.fill.width = Math.max(0.001, this.width * this.value);
        this.handle.x = this.x + this.width * this.value;
        this.valueText.setText(`${Math.round(this.value * 100)}%`);
    }

    setDepth(depth) {
        this.parts.forEach((part, index) => part.setDepth(depth + (part === this.handle ? 0.5 : 0)));
        return this;
    }

    destroy() {
        this.scene.input.off("pointermove", this.onMove);
        this.scene.input.off("pointerup", this.onUp);
        this.scene.input.off("pointerupoutside", this.onUp);
        this.parts.forEach((part) => part.destroy());
    }
}
