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

        // Cumulative correct/total across every section battle fought so far
        // in this lesson attempt, carried forward to the final exam & results.
        this.battleScore = data.battleScore ?? 0;
        this.battleTotal = data.battleTotal ?? 0;
    }

    create() {
        this.drawBackground();
        this.createHeader();
        this.createContentArea();
        this.createContinueButton();
        this.renderSection();
    }

    drawBackground() {
        this.add.image(640, 360, "bg-classroom").setDisplaySize(1280, 720);
        this.add.rectangle(640, 380, 1000, 480, 0x0b0f1a, 0.75).setStrokeStyle(2, 0x5f74bd);
    }

    createHeader() {
        this.add
            .text(640, 90, this.lesson.title, {
                fontFamily: "Arial",
                fontSize: "34px",
                fontStyle: "bold",
                color: "#ffffff",
            })
            .setOrigin(0.5);

        this.progressLabel = this.add
            .text(640, 130, "", {
                fontFamily: "Arial",
                fontSize: "16px",
                color: "#c7d2fe",
            })
            .setOrigin(0.5);
    }

    createContentArea() {
        this.sectionTitle = this.add.text(220, 190, "", {
            fontFamily: "Arial",
            fontSize: "26px",
            fontStyle: "bold",
            color: "#facc15",
        });

        this.sectionContent = this.add.text(220, 240, "", {
            fontFamily: "Arial",
            fontSize: "18px",
            color: "#e2e8f0",
            wordWrap: { width: 840 },
            lineSpacing: 6,
        });

        this.exampleText = this.add.text(220, 470, "", {
            fontFamily: "monospace",
            fontSize: "16px",
            color: "#93c5fd",
            wordWrap: { width: 840 },
        });
    }

    createContinueButton() {
        this.continueButton = new Button(this, 640, 650, "", () => this.startSectionBattle(), {
            width: 320,
        });
    }

    renderSection() {
        const sections = this.lesson.sections;
        const section = sections[this.sectionIndex];

        this.progressLabel.setText(`Section ${this.sectionIndex + 1} / ${sections.length}`);
        this.sectionTitle.setText(section.title);
        this.sectionContent.setText(section.content);

        const examples = section.examples ?? [];
        this.exampleText.setText(examples.length ? examples.join("\n") : "");

        const isFinalSection = this.sectionIndex === sections.length - 1;
        this.continueButton.setText(isFinalSection ? "FACE THE FINAL BOSS" : "START SECTION QUIZ");
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
}
