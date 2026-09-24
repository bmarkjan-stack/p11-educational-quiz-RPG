import Phaser from "phaser";
import Button from "../ui/Button.js";
import ProgressManager from "../systems/ProgressManager.js";
import { CAPSTONE_LESSON } from "../systems/curriculum.js";

export default class LessonScene extends Phaser.Scene {
    constructor() {
        super("LessonScene");
    }

    init(data) {
        this.lesson = data.lesson;
        this.character = data.character;
        this.characterName = data.characterName;
        this.sectionIndex = data.sectionIndex ?? 0;
        this.awardsExperience = data.awardsExperience ?? true;

        // Cumulative correct/total across every section battle
        // fought so far in this lesson attempt.
        this.battleScore = data.battleScore ?? 0;
        this.battleTotal = data.battleTotal ?? 0;
        this.examCorrect = data.examCorrect ?? 0;
        this.examTotal = data.examTotal ?? 0;
    }

    create() {
        this.progressManager = new ProgressManager();
        this.saveCheckpoint();

        this.drawBackground();
        this.createLessonPanel();
        this.createHeader();
        this.createContentArea();
        this.createContinueButton();
        this.renderSection();
        this.createBackButton();
    }

    saveCheckpoint() {
        if (!this.awardsExperience) return;

        this.progressManager.saveLessonCheckpoint(this.lesson.id, {
            stage: "lesson",
            sectionIndex: this.sectionIndex,
            battleScore: this.battleScore,
            battleTotal: this.battleTotal,
            examCorrect: this.examCorrect,
            examTotal: this.examTotal,
        });
    }

    drawBackground() {
        this.add
            .image(640, 360, "bg-classroom")
            .setDisplaySize(1280, 720);
    }

    createLessonPanel() {
        this.add
            .image(640, 360, "lesson-panel-body")
            .setOrigin(0.5);

        this.add
            .image(640, 360, "lesson-panel-title")
            .setOrigin(0.5);
    }

    createHeader() {
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
            this.lesson.id === CAPSTONE_LESSON
                ? "START SECTION EXAM"
                : "START SECTION QUIZ"
        );
    }

    startSectionBattle() {
        const sceneKey = this.lesson.id === CAPSTONE_LESSON
            ? "ExamScene"
            : "BattleScene";

        this.scene.start(sceneKey, {
            lesson: this.lesson,
            character: this.character,
            characterName: this.characterName,
            sectionIndex: this.sectionIndex,
            battleScore: this.battleScore,
            battleTotal: this.battleTotal,
            awardsExperience: this.awardsExperience,
            examSectionIndex: this.sectionIndex,
            examCorrect: this.examCorrect,
            examTotal: this.examTotal,
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