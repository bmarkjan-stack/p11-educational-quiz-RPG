export default class Button {
    constructor(scene, x, y, text, callback, options = {}) {
        const {
            width = 220,
            height = 56,
            fontSize = "20px",
            fillColor = 0x1e293b,
            hoverColor = 0x334155,
            strokeColor = 0x5f74bd,
            textColor = "#ffffff",
            disabledColor = 0x0f172a,
        } = options;

        this.scene = scene;
        this.callback = callback;
        this.disabled = false;
        this.colors = { fillColor, hoverColor, disabledColor };

        this.background = scene.add
            .rectangle(x, y, width, height, fillColor, 0.95)
            .setStrokeStyle(2, strokeColor)
            .setInteractive({ useHandCursor: true });

        this.label = scene.add
            .text(x, y, text, {
                fontFamily: "Arial",
                fontSize,
                fontStyle: "bold",
                color: textColor,
            })
            .setOrigin(0.5);

        this.background.on("pointerover", () => {
            if (!this.disabled) {
                this.background.setFillStyle(hoverColor, 1);
            }
        });

        this.background.on("pointerout", () => {
            if (!this.disabled) {
                this.background.setFillStyle(fillColor, 0.95);
            }
        });

        this.background.on("pointerdown", () => {
            if (!this.disabled && this.callback) {
                this.callback();
            }
        });
    }

    setText(text) {
        this.label.setText(text);
    }

    setEnabled(enabled) {
        this.disabled = !enabled;

        this.background.setFillStyle(
            enabled ? this.colors.fillColor : this.colors.disabledColor,
            enabled ? 0.95 : 0.6
        );

        this.label.setAlpha(enabled ? 1 : 0.5);
        this.background.disableInteractive();

        if (enabled) {
            this.background.setInteractive({ useHandCursor: true });
        }
    }

    setPosition(x, y) {
        this.background.setPosition(x, y);
        this.label.setPosition(x, y);
    }

    setVisible(visible) {
        this.background.setVisible(visible);
        this.label.setVisible(visible);
    }

    setDepth(depth) {
        this.background.setDepth(depth);
        this.label.setDepth(depth);
    }

    destroy() {
        this.background.destroy();
        this.label.destroy();
    }
}