import Phaser from "phaser";
import Button from "../ui/Button.js";
import ProgressManager from "../systems/ProgressManager.js";
import { CAPSTONE_LESSON } from "../systems/curriculum.js";
import { applyFloatyText } from "../ui/sceneEffects.js";

export default class LessonScene extends Phaser.Scene {
    constructor() {
        super("LessonScene");
    }

    init(data) {
        this.lesson = data.lesson;
        this.character = data.character;
        this.characterName = data.characterName;
        this.sectionIndex = data.sectionIndex ?? 0;
        this.pageIndex = 0;
        this.awardsExperience = data.awardsExperience ?? true;

        // Cumulative correct/total across every section battle
        // fought so far in this lesson attempt.
        this.battleScore = data.battleScore ?? 0;
        this.battleTotal = data.battleTotal ?? 0;
        this.examCorrect = data.examCorrect ?? 0;
        this.examTotal = data.examTotal ?? 0;
    }

    create() {
        applyFloatyText(this);
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

        this.pageLabel = this.add.text(640, 570, "", {
            fontFamily: "MedievalSharp",
            fontSize: "16px",
            color: "#f5e6c8",
            stroke: "#1a0f05",
            strokeThickness: 2,
        }).setOrigin(0.5);
    }

    createContinueButton() {
        this.continueButton = new Button(
            this,
            810,
            650,
            "",
            () => this.advanceLessonPage(),
            {
                width: 300,
            }
        );

        this.previousPageButton = new Button(
            this,
            470,
            650,
            "PREVIOUS",
            () => this.showLessonPage(this.pageIndex - 1),
            { width: 300 }
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
        this.pages = Array.isArray(section.pages) && section.pages.length > 0
            ? section.pages
            : [section];
        this.pageIndex = 0;
        this.renderLessonPage();
    }

    renderLessonPage() {
        const page = this.pages[this.pageIndex];
        this.sectionContent.setText(page.content ?? "");

        const examples = page.examples ?? [];

        this.exampleText.setText(
            examples.length
                ? examples.join("\n")
                : ""
        );

        this.exampleText.setVisible(examples.length > 0);
        this.pageLabel.setText(`Page ${this.pageIndex + 1} / ${this.pages.length}`);
        this.previousPageButton.setEnabled(this.pageIndex > 0);

        this.continueButton.setText(
            this.pageIndex < this.pages.length - 1
                ? "NEXT PAGE"
                : this.lesson.id === CAPSTONE_LESSON
                    ? "START SECTION EXAM"
                    : "START SECTION QUIZ"
        );
    }

    showLessonPage(pageIndex) {
        if (pageIndex < 0 || pageIndex >= this.pages.length) return;

        this.pageIndex = pageIndex;
        this.renderLessonPage();
    }

    advanceLessonPage() {
        if (this.pageIndex < this.pages.length - 1) {
            this.showLessonPage(this.pageIndex + 1);
            return;
        }

        this.startSectionBattle();
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
            110,
            35,
            "Return to World Map",
            () => {
                this.scene.start("LessonSelectScene");
            },
            { width: 180, height: 40, fontSize: "14px" }
        );
    }
}