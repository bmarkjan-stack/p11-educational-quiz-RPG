import Phaser from "phaser";
import Button from "../ui/Button.js";

export default class LessonScene extends Phaser.Scene {
    constructor() {
        super("LessonScene");
    }

    init(data) {
        this.lesson = data.lesson;
        this.character = data.character;
        this.characterName = data.characterName;
        this.sectionIndex = data.sectionIndex ?? 0;

        // Cumulative correct/total across every section battle
        // fought so far in this lesson attempt.
        this.battleScore = data.battleScore ?? 0;
        this.battleTotal = data.battleTotal ?? 0;
    }

    create() {
        this.drawBackground();
        this.createLessonPanel();
        this.createHeader();
        this.createContentArea();
        this.createContinueButton();
        this.renderSection();
        this.createBackButton();
    }

    drawBackground() {
        this.add
            .image(640, 360, "bg-classroom")
            .setDisplaySize(1280, 720);
    }

    createLessonPanel() {
        // The panel artwork is already sized for the 1280x720 canvas.
        // Both UI images are simply centered on the canvas.
        this.add
            .image(640, 360, "lesson-panel-body")
            .setOrigin(0.5);

        this.add
            .image(640, 360, "lesson-panel-title")
            .setOrigin(0.5);
    }

    createHeader() {
        // Text is positioned independently of the title artwork.
        this.add
            .text(640, 95, this.lesson.title, {
                fontFamily: "Cinzel Decorative",
                fontSize: "28px",
                fontStyle: "bold",
                color: "#ffffff",
                stroke: "#1a0f05",
                strokeThickness: 4,
                shadow: {
                    offsetX: 2,
                    offsetY: 2,
                    color: "#000000",
                    blur: 4,
                    stroke: true,
                    fill: true,
                },
            })
            .setOrigin(0.5);

        this.progressLabel = this.add
            .text(640, 143, "", {
                fontFamily: "MedievalSharp",
                fontSize: "18px",
                color: "#f5e6c8",
                stroke: "#1a0f05",
                strokeThickness: 2,
            })
            .setOrigin(0.5);
    }

    createContentArea() {
        this.sectionTitle = this.add.text(240, 215, "", {
            fontFamily: "Cinzel Decorative",
            fontSize: "25px",
            fontStyle: "bold",
            color: "#facc15",
            stroke: "#1a0f05",
            strokeThickness: 3,
        });

        this.sectionContent = this.add.text(190, 300, "", {
            fontFamily: "IM Fell English",
            fontSize: "21px",
            color: "#f5ead7",
            wordWrap: {
                width: 500,
            },
            lineSpacing: 8,
            shadow: {
                offsetX: 1,
                offsetY: 1,
                color: "#000000",
                blur: 2,
                stroke: true,
                fill: true,
            },
        });

        this.exampleText = this.add.text(800, 235, "", {
            fontFamily: "Pixelify Sans",
            fontSize: "17px",
            color: "#93c5fd",
            wordWrap: {
                width: 300,
            },
            lineSpacing: 5,
        });
    }

    createContinueButton() {
        this.continueButton = new Button(
            this,
            840,
            650,
            "",
            () => this.startSectionBattle(),
            {
                width: 320,
            }
        );
    }

    renderSection() {
        const sections = this.lesson.sections;
        const section = sections[this.sectionIndex];

        if (!section) {
            console.warn(
                `LessonScene: Section ${this.sectionIndex} does not exist.`
            );
            return;
        }

        this.progressLabel.setText(
            `Section ${this.sectionIndex + 1} / ${sections.length}`
        );

        this.sectionTitle.setText(section.title);
        this.sectionContent.setText(section.content);

        const examples = section.examples ?? [];

        this.exampleText.setText(
            examples.length
                ? examples.join("\n")
                : ""
        );

        this.exampleText.setVisible(examples.length > 0);

        this.continueButton.setText(
            "START SECTION QUIZ"
        );
    }

    startSectionBattle() {
        this.scene.start("BattleScene", {
            lesson: this.lesson,
            character: this.character,
            characterName: this.characterName,
            sectionIndex: this.sectionIndex,
            battleScore: this.battleScore,
            battleTotal: this.battleTotal,
        });
    }

    createBackButton() {
        new Button(
            this,
            440,
            650,
            "BACK",
            () => {
                this.scene.start("LessonSelectScene");
            },
            { width: 320 }
        );
    }
}