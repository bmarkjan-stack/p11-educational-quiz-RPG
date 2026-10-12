import Phaser from "phaser";

/**
 * Simple drop-down selector. Click the box to open the list, click an option
 * (or anywhere else to dismiss).
 */
export default class Dropdown {
    constructor(scene, { x, y, width = 300, height = 44, options, value, onChange, depth = 11 }) {
        this.scene = scene;
        this.options = options;
        this.value = value;
        this.onChange = onChange;
        this.depth = depth;
        this.open = false;
        this.listParts = [];

        this.box = scene.add.rectangle(x, y, width, height, 0x111827, 0.95)
            .setStrokeStyle(2, 0x5f74bd)
            .setInteractive({ useHandCursor: true });

        this.text = scene.add
            .text(x - width / 2 + 14, y, "", {
                fontFamily: "LearnQuest",
                fontSize: "20px",
                color: "#ffffff",
            })
            .setOrigin(0, 0.5);

        this.arrow = scene.add.triangle(x + width / 2 - 24, y, 0, 0, 16, 0, 8, 10, 0xfacc15).setOrigin(0.5);

        this.box.on("pointerover", () => this.box.setStrokeStyle(2, 0xfacc15));
        this.box.on("pointerout", () => this.box.setStrokeStyle(2, 0x5f74bd));
        this.box.on("pointerdown", () => (this.open ? this.closeList() : this.openList()));

        this.geometry = { x, y, width, height };
        this.parts = [this.box, this.text, this.arrow];
        this.refresh();
        this.setDepth(depth);
    }

    refresh() {
        const match = this.options.find((option) => option.value === this.value);
        this.text.setText(match ? match.label : "");
    }

    openList() {
        const { x, y, width, height } = this.geometry;
        const scene = this.scene;
        this.open = true;
        this.arrow.setAngle(180);

        // Click-away catcher
        const catcher = scene.add.rectangle(640, 360, 1280, 720, 0x000000, 0.001)
            .setInteractive()
            .setDepth(this.depth + 10);
        catcher.on("pointerdown", () => this.closeList());
        this.listParts.push(catcher);

        const rowHeight = height;
        const top = y + height / 2 + 4;

        const bg = scene.add.rectangle(x, top + (rowHeight * this.options.length) / 2, width, rowHeight * this.options.length, 0x0f172a, 1)
            .setStrokeStyle(2, 0xfacc15)
            .setDepth(this.depth + 11);
        this.listParts.push(bg);

        this.options.forEach((option, index) => {
            const rowY = top + rowHeight * index + rowHeight / 2;
            const selected = option.value === this.value;

            const row = scene.add.rectangle(x, rowY, width - 6, rowHeight - 4, selected ? 0x1e3a8a : 0x0f172a, 1)
                .setInteractive({ useHandCursor: true })
                .setDepth(this.depth + 12);
            const label = scene.add
                .text(x - width / 2 + 14, rowY, option.label, {
                    fontFamily: "LearnQuest",
                    fontSize: "20px",
                    color: selected ? "#facc15" : "#ffffff",
                })
                .setOrigin(0, 0.5)
                .setDepth(this.depth + 13);

            row.on("pointerover", () => row.setFillStyle(0x334155, 1));
            row.on("pointerout", () => row.setFillStyle(selected ? 0x1e3a8a : 0x0f172a, 1));
            row.on("pointerdown", () => this.choose(option.value));

            this.listParts.push(row, label);
        });
    }

    closeList() {
        this.listParts.forEach((part) => part.destroy());
        this.listParts = [];
        this.open = false;
        this.arrow.setAngle(0);
    }

    async choose(value) {
        this.closeList();
        if (value === this.value) return;

        this.value = value;
        this.refresh();

        const applied = await this.onChange?.(value);
        if (applied && applied !== this.value && this.text.active) {
            this.value = applied;
            this.refresh();
        }
    }

    setDepth(depth) {
        this.depth = depth;
        this.parts.forEach((part) => part.setDepth(depth));
        return this;
    }

    destroy() {
        this.closeList();
        this.parts.forEach((part) => part.destroy());
    }
}
