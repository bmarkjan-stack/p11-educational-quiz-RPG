import Phaser from "phaser";

export default class CharacterSelectScene extends Phaser.Scene {
    constructor() {
        super("CharacterSelectScene");
    }

    create() {
        this.selectedCharacter = null;

        this.drawBackground();
        this.createTitle();
        this.createCharacterOptions();
        this.createNameInput();
        this.createButtons();
    }

    drawBackground() {
        const background = this.add.image(
            640,
            360,
            "bg-character-creation"
        );

        background.setDisplaySize(1280, 720);
    }

    createTitle() {
        this.add.text(
            640,
            95,
            "CHOOSE YOUR ADVENTURER",
            {
                fontFamily: "Arial",
                fontSize: "36px",
                fontStyle: "bold",
                color: "#ffffff"
            }
        ).setOrigin(0.5);

        this.add.text(
            640,
            145,
            "Select your character to begin.",
            {
                fontFamily: "Arial",
                fontSize: "20px",
                color: "#c7d2fe"
            }
        ).setOrigin(0.5);
    }

    createCharacterOptions() {
        this.createCharacterCard(
            420,
            "male",
            "MALE",
            "Male Adventurer"
        );

        this.createCharacterCard(
            860,
            "female",
            "FEMALE",
            "Female Adventurer"
        );
    }

    createCharacterCard(x, id, title, description) {
        const card = this.add.rectangle(
            x,
            360,
            280,
            260,
            0x111827,
            0.9
        );

        card.setStrokeStyle(2, 0x5f74bd);

        const titleText = this.add.text(
            x,
            300,
            title,
            {
                fontFamily: "Arial",
                fontSize: "26px",
                fontStyle: "bold",
                color: "#ffffff"
            }
        ).setOrigin(0.5);

        const descriptionText = this.add.text(
            x,
            410,
            description,
            {
                fontFamily: "Arial",
                fontSize: "16px",
                color: "#c7d2fe"
            }
        ).setOrigin(0.5);

        card.setInteractive({ useHandCursor: true });

        card.on("pointerover", () => {
            card.setStrokeStyle(3, 0x8da2e8);
        });

        card.on("pointerout", () => {
            if (this.selectedCharacter !== id) {
                card.setStrokeStyle(2, 0x5f74bd);
            }
        });

        card.on("pointerdown", () => {
            this.selectCharacter(
                id,
                card,
                titleText,
                descriptionText
            );
        });

        this.characterCards ??= {};

        this.characterCards[id] = {
            card,
            titleText,
            descriptionText
        };
    }

    selectCharacter(id, card, titleText, descriptionText) {
        this.selectedCharacter = id;

        Object.entries(this.characterCards).forEach(
            ([characterId, character]) => {
                if (characterId === id) {
                    character.card.setStrokeStyle(
                        4,
                        0xffffff
                    );

                    character.card.setFillStyle(
                        0x1e293b,
                        0.95
                    );
                } else {
                    character.card.setStrokeStyle(
                        2,
                        0x5f74bd
                    );

                    character.card.setFillStyle(
                        0x111827,
                        0.9
                    );
                }
            }
        );
    }

    createNameInput() {
        this.add.text(
            640,
            505,
            "ADVENTURER NAME",
            {
                fontFamily: "Arial",
                fontSize: "18px",
                fontStyle: "bold",
                color: "#ffffff"
            }
        ).setOrigin(0.5);

        /*
         * Phaser does not provide a normal HTML-style text input.
         *
         * For now, create a visual input field.
         * We can add actual keyboard input in the next step.
         */
        this.nameBox = this.add.rectangle(
            640,
            550,
            360,
            55,
            0x111827,
            0.95
        );

        this.nameBox.setStrokeStyle(2, 0x5f74bd);

        this.nameText = this.add.text(
            640,
            550,
            "Enter your name...",
            {
                fontFamily: "Arial",
                fontSize: "18px",
                color: "#94a3b8"
            }
        ).setOrigin(0.5);

        this.nameBox.setInteractive({
            useHandCursor: true
        });

        this.nameBox.on("pointerdown", () => {
            this.activateNameInput();
        });
    }

    activateNameInput() {
        /*
         * Temporary implementation.
         *
         * Actual keyboard text input can be added later
         * using Phaser keyboard events.
         */

        this.nameText.setText("");
        this.nameText.setColor("#ffffff");

        this.nameText.setText("Adventurer");
    }

    createButtons() {
        this.createButton(
            500,
            650,
            "BACK",
            () => {
                this.scene.start("MenuScene");
            }
        );

        this.createButton(
            780,
            650,
            "CONFIRM",
            () => {
                this.confirmCharacter();
            }
        );
    }

    createButton(x, y, text, callback) {
        const button = this.add.rectangle(
            x,
            y,
            200,
            55,
            0x1e293b,
            0.95
        );

        button.setStrokeStyle(
            2,
            0x5f74bd
        );

        button.setInteractive({
            useHandCursor: true
        });

        const buttonText = this.add.text(
            x,
            y,
            text,
            {
                fontFamily: "Arial",
                fontSize: "18px",
                fontStyle: "bold",
                color: "#ffffff"
            }
        ).setOrigin(0.5);

        button.on("pointerover", () => {
            button.setFillStyle(0x334155, 1);
        });

        button.on("pointerout", () => {
            button.setFillStyle(0x1e293b, 0.95);
        });

        button.on("pointerdown", callback);
    }

    confirmCharacter() {
        if (!this.selectedCharacter) {
            this.showMessage(
                "Character Required",
                "Please select a character first."
            );

            return;
        }

        /*
         * LessonSelectScene does not exist yet.
         *
         * For now, we can simply log the selected character.
         *
         * Once LessonSelectScene is created, replace this
         * with:
         *
         * this.scene.start("LessonSelectScene", {
         *     character: this.selectedCharacter
         * });
         */

        console.log(
            "Selected character:",
            this.selectedCharacter
        );
    }

    showMessage(title, message) {
        const overlay = this.add.rectangle(
            640,
            360,
            700,
            300,
            0x070b18,
            0.97
        );

        overlay
            .setStrokeStyle(2, 0x5f74bd)
            .setDepth(10);

        const titleText = this.add.text(
            640,
            285,
            title,
            {
                fontFamily: "Arial",
                fontSize: "30px",
                fontStyle: "bold",
                color: "#ffffff"
            }
        )
            .setOrigin(0.5)
            .setDepth(11);

        const messageText = this.add.text(
            640,
            350,
            message,
            {
                fontFamily: "Arial",
                fontSize: "18px",
                color: "#c7d2fe",
                align: "center",
                wordWrap: {
                    width: 550
                }
            }
        )
            .setOrigin(0.5)
            .setDepth(11);

        const closeButton = this.add.rectangle(
            640,
            430,
            160,
            50,
            0x1e293b
        )
            .setStrokeStyle(2, 0x5f74bd)
            .setInteractive({
                useHandCursor: true
            })
            .setDepth(11);

        const closeText = this.add.text(
            640,
            430,
            "OK",
            {
                fontFamily: "Arial",
                fontSize: "18px",
                fontStyle: "bold",
                color: "#ffffff"
            }
        )
            .setOrigin(0.5)
            .setDepth(12);

        closeButton.on("pointerdown", () => {
            overlay.destroy();
            titleText.destroy();
            messageText.destroy();
            closeButton.destroy();
            closeText.destroy();
        });
    }
}