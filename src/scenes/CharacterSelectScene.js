import Phaser from "phaser";
import Button from "../ui/Button.js";

export default class CharacterSelectScene extends Phaser.Scene {
    constructor() {
        super("CharacterSelectScene");
    }

    create() {
        this.selectedCharacter = null;
        this.characterName = "";
        this.characterCards = {};

        this.drawBackground();
        this.createTitle();
        this.createCharacterOptions();
        this.createNameInput();
        this.createButtons();
        this.bindKeyboard();

        this.events.once("shutdown", () => this.cleanupKeyboard());
    }

    drawBackground() {
        this.add.image(640, 360, "bg-character-creation").setDisplaySize(1280, 720);
    }

    createTitle() {
        this.add
            .text(640, 85, "CHOOSE YOUR ADVENTURER", {
                fontFamily: "Arial",
                fontSize: "36px",
                fontStyle: "bold",
                color: "#ffffff",
            })
            .setOrigin(0.5);

        this.add
            .text(640, 130, "Select your character to begin.", {
                fontFamily: "Arial",
                fontSize: "20px",
                color: "#c7d2fe",
            })
            .setOrigin(0.5);
    }

    createCharacterOptions() {
        this.createCharacterCard(420, "male", "MALE", "Male Adventurer");
        this.createCharacterCard(860, "female", "FEMALE", "Female Adventurer");
    }

    createCharacterCard(x, id, title, description) {
        const card = this.add
            .rectangle(x, 340, 280, 220, 0x111827, 0.9)
            .setStrokeStyle(2, 0x5f74bd);

        const sprite = this.add.image(x, 280, `player-${id}`).setScale(0.35);

        const titleText = this.add
            .text(x, 400, title, {
                fontFamily: "Arial",
                fontSize: "26px",
                fontStyle: "bold",
                color: "#ffffff",
            })
            .setOrigin(0.5);

        const descriptionText = this.add
            .text(x, 435, description, {
                fontFamily: "Arial",
                fontSize: "16px",
                color: "#c7d2fe",
            })
            .setOrigin(0.5);

        card.setInteractive({ useHandCursor: true });

        card.on("pointerover", () => card.setStrokeStyle(3, 0x8da2e8));

        card.on("pointerout", () => {
            if (this.selectedCharacter !== id) {
                card.setStrokeStyle(2, 0x5f74bd);
            }
        });

        card.on("pointerdown", () => this.selectCharacter(id));

        this.characterCards[id] = { card, sprite, titleText, descriptionText };
    }

    selectCharacter(id) {
        this.selectedCharacter = id;

        Object.entries(this.characterCards).forEach(([characterId, character]) => {
            const isSelected = characterId === id;

            character.card.setStrokeStyle(isSelected ? 4 : 2, isSelected ? 0xffffff : 0x5f74bd);
            character.card.setFillStyle(isSelected ? 0x1e293b : 0x111827, isSelected ? 0.95 : 0.9);
        });
    }

    createNameInput() {
        this.add
            .text(640, 500, "ADVENTURER NAME (type to enter)", {
                fontFamily: "Arial",
                fontSize: "16px",
                fontStyle: "bold",
                color: "#ffffff",
            })
            .setOrigin(0.5);

        this.nameBox = this.add
            .rectangle(640, 540, 400, 55, 0x111827, 0.95)
            .setStrokeStyle(2, 0x5f74bd);

        this.nameText = this.add
            .text(640, 540, "Enter your name...", {
                fontFamily: "Arial",
                fontSize: "18px",
                color: "#94a3b8",
            })
            .setOrigin(0.5);
    }

    bindKeyboard() {
        this.keydownHandler = (event) => {
            if (event.key === "Backspace") {
                this.characterName = this.characterName.slice(0, -1);
            } else if (
                event.key.length === 1 &&
                this.characterName.length < 14 &&
                /[a-zA-Z0-9 ]/.test(event.key)
            ) {
                this.characterName += event.key;
            } else {
                return;
            }

            this.nameText.setColor(this.characterName ? "#ffffff" : "#94a3b8");
            this.nameText.setText(this.characterName || "Enter your name...");
        };

        this.input.keyboard.on("keydown", this.keydownHandler);
    }

    cleanupKeyboard() {
        if (this.keydownHandler) {
            this.input.keyboard.off("keydown", this.keydownHandler);
        }
    }

    createButtons() {
        new Button(
            this,
            500,
            650,
            "BACK",
            () => {
                this.scene.start("MenuScene");
            },
            { width: 180 }
        );

        new Button(this, 780, 650, "CONFIRM", () => this.confirmCharacter(), { width: 180 });
    }

    confirmCharacter() {
        if (!this.selectedCharacter) {
            this.showMessage("Character Required", "Please select a character first.");
            return;
        }

        this.scene.start("LessonSelectScene", {
            character: this.selectedCharacter,
            characterName: this.characterName.trim() || "Adventurer",
        });
    }

    showMessage(title, message) {
        const overlay = this.add
            .rectangle(640, 360, 700, 300, 0x070b18, 0.97)
            .setStrokeStyle(2, 0x5f74bd)
            .setDepth(10);

        const titleText = this.add
            .text(640, 285, title, {
                fontFamily: "Arial",
                fontSize: "30px",
                fontStyle: "bold",
                color: "#ffffff",
            })
            .setOrigin(0.5)
            .setDepth(11);

        const messageText = this.add
            .text(640, 350, message, {
                fontFamily: "Arial",
                fontSize: "18px",
                color: "#c7d2fe",
                align: "center",
                wordWrap: { width: 550 },
            })
            .setOrigin(0.5)
            .setDepth(11);

        const closeButton = new Button(
            this,
            640,
            430,
            "OK",
            () => {
                overlay.destroy();
                titleText.destroy();
                messageText.destroy();
                closeButton.destroy();
            },
            { width: 160 }
        );

        closeButton.setDepth(11);
    }
}
