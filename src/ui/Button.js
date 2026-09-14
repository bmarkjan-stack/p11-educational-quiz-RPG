export default class Button {
    constructor(scene, x, y, text, callback, options = {}) {
        const {
            width = 220,
            height = 56,

            normalTexture = "button-normal",
            hoverTexture = "button-hover",
            activeTexture = "button-active",

            fontFamily = "LearnQuest",
            fontSize = "20px",
            textColor = "#ffffff",

            disabledAlpha = 0.5,
        } = options;

        this.scene = scene;
        this.callback = callback;
        this.disabled = false;
        this.disabledAlpha = disabledAlpha;

        /*
         * --------------------------------------------------
         * Button Images
         * --------------------------------------------------
         */

        this.normalImage = scene.add
            .image(x, y, normalTexture)
            .setDisplaySize(width, height);

        this.hoverImage = scene.add
            .image(x, y, hoverTexture)
            .setDisplaySize(width, height)
            .setVisible(false);

        this.activeImage = scene.add
            .image(x, y, activeTexture)
            .setDisplaySize(width, height)
            .setVisible(false);

        /*
         * --------------------------------------------------
         * Invisible Interactive Area
         * --------------------------------------------------
         *
         * This rectangle handles mouse interaction.
         * The PNG images are only visual.
         */

        this.background = scene.add
            .rectangle(
                x,
                y,
                width,
                height,
                0xffffff,
                0
            )
            .setInteractive({
                useHandCursor: true,
            });

        /*
         * --------------------------------------------------
         * Button Label
         * --------------------------------------------------
         */

        this.label = scene.add
            .text(x, y, text, {
                fontFamily,
                fontSize,
                fontStyle: "bold",
                color: textColor,
            })
            .setOrigin(0.5);

        /*
         * --------------------------------------------------
         * Pointer Over
         * --------------------------------------------------
         */

        this.background.on("pointerover", () => {
            if (this.disabled) return;

            this.showHoverState();
        });

        /*
         * --------------------------------------------------
         * Pointer Out
         * --------------------------------------------------
         */

        this.background.on("pointerout", () => {
            if (this.disabled) return;

            this.showNormalState();
        });

        /*
         * --------------------------------------------------
         * Pointer Down
         * --------------------------------------------------
         */

        this.background.on("pointerdown", () => {
            if (this.disabled) return;

            this.showActiveState();
        });

        /*
         * --------------------------------------------------
         * Pointer Up
         * --------------------------------------------------
         */

        this.background.on("pointerup", () => {
            if (this.disabled) return;

            /*
             * Return to hover because the mouse
             * is still over the button.
             */

            this.showHoverState();

            if (this.callback) {
                this.callback();
            }
        });
    }

    /*
     * ------------------------------------------------------
     * Button Visual States
     * ------------------------------------------------------
     */

    showNormalState() {
        this.normalImage.setVisible(true);
        this.hoverImage.setVisible(false);
        this.activeImage.setVisible(false);
    }

    showHoverState() {
        this.normalImage.setVisible(false);
        this.hoverImage.setVisible(true);
        this.activeImage.setVisible(false);
    }

    showActiveState() {
        this.normalImage.setVisible(false);
        this.hoverImage.setVisible(false);
        this.activeImage.setVisible(true);
    }

    /*
     * ------------------------------------------------------
     * Change Text
     * ------------------------------------------------------
     */

    setText(text) {
        this.label.setText(text);
    }

    /*
     * ------------------------------------------------------
     * Enable / Disable
     * ------------------------------------------------------
     */

    setEnabled(enabled) {
        this.disabled = !enabled;

        if (enabled) {
            this.normalImage.setAlpha(1);
            this.hoverImage.setAlpha(1);
            this.activeImage.setAlpha(1);

            this.label.setAlpha(1);

            this.background.setInteractive({
                useHandCursor: true,
            });

            this.showNormalState();
        } else {
            this.normalImage.setAlpha(this.disabledAlpha);
            this.hoverImage.setAlpha(this.disabledAlpha);
            this.activeImage.setAlpha(this.disabledAlpha);

            this.label.setAlpha(this.disabledAlpha);

            this.background.disableInteractive();

            this.showNormalState();
        }
    }

    /*
     * ------------------------------------------------------
     * Position
     * ------------------------------------------------------
     */

    setPosition(x, y) {
        this.normalImage.setPosition(x, y);
        this.hoverImage.setPosition(x, y);
        this.activeImage.setPosition(x, y);

        this.background.setPosition(x, y);
        this.label.setPosition(x, y);
    }

    /*
     * ------------------------------------------------------
     * Visibility
     * ------------------------------------------------------
     */

    setVisible(visible) {
        if (!visible) {
            this.normalImage.setVisible(false);
            this.hoverImage.setVisible(false);
            this.activeImage.setVisible(false);

            this.background.setVisible(false);
            this.label.setVisible(false);

            return;
        }

        this.background.setVisible(true);
        this.label.setVisible(true);

        if (!this.disabled) {
            this.showNormalState();
        }
    }

    /*
     * ------------------------------------------------------
     * Depth
     * ------------------------------------------------------
     */

    setDepth(depth) {
        this.normalImage.setDepth(depth);
        this.hoverImage.setDepth(depth);
        this.activeImage.setDepth(depth);

        /*
         * Interactive area above the images.
         */

        this.background.setDepth(depth + 1);

        /*
         * Text above everything.
         */

        this.label.setDepth(depth + 2);
    }

    /*
     * ------------------------------------------------------
     * Destroy
     * ------------------------------------------------------
     */

    destroy() {
        this.normalImage.destroy();
        this.hoverImage.destroy();
        this.activeImage.destroy();

        this.background.destroy();
        this.label.destroy();
    }
}