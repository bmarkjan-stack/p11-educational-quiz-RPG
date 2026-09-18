import Phaser from "phaser";
import Button from "../ui/Button.js";
import { CAPSTONE_LESSON } from "../systems/curriculum.js";

export default class ResultsScene extends Phaser.Scene {
    constructor() {
        super("ResultsScene");
    }

    init(data) {
        this.data = data;
    }

    create() {
        const {
            lesson,
            characterName,
            battleScore,
            battleTotal,
            examScore,
            examTotal,
            accuracy,
            passed,
        } = this.data;

        const isCapstoneVictory = lesson.id === CAPSTONE_LESSON && passed;

        this.add.image(640, 360, "bg-classroom").setDisplaySize(1280, 720);

        this.add
            .rectangle(640, 360, 760, 520, 0x0b0f1a, 0.9)
            .setStrokeStyle(2, isCapstoneVictory ? 0xfacc15 : passed ? 0x22c55e : 0xdc2626);

        this.add
            .text(640, 160, isCapstoneVictory ? "FULL-STACK DEVELOPER!" : "LESSON COMPLETE!", {
                fontFamily: "Arial",
                fontSize: isCapstoneVictory ? "32px" : "38px",
                fontStyle: "bold",
                color: isCapstoneVictory ? "#facc15" : "#ffffff",
            })
            .setOrigin(0.5);

        this.add
            .text(640, 205, `${lesson.title} \u2014 ${characterName}`, {
                fontFamily: "Arial",
                fontSize: "20px",
                color: "#c7d2fe",
            })
            .setOrigin(0.5);

        this.add
            .text(
                640,
                300,
                `Battle Score: ${battleScore} / ${battleTotal}\nExam Score:   ${examScore} / ${examTotal}\n\nAccuracy: ${accuracy}%`,
                {
                    fontFamily: "monospace",
                    fontSize: "22px",
                    color: "#e2e8f0",
                    align: "center",
                    lineSpacing: 10,
                }
            )
            .setOrigin(0.5);

        this.add
            .text(
                640,
                430,
                isCapstoneVictory ? "\u2605 You mastered the full stack! \u2605" : passed ? "\u2605 PASSED \u2605" : "TRY AGAIN",
                {
                    fontFamily: "Arial",
                    fontSize: isCapstoneVictory ? "22px" : "30px",
                    fontStyle: "bold",
                    color: passed ? "#facc15" : "#f87171",
                    align: "center",
                    wordWrap: { width: 620 },
                }
            )
            .setOrigin(0.5);

        this.createButtons(isCapstoneVictory);
    }

    createButtons(isCapstoneVictory) {
        if (isCapstoneVictory) {
            new Button(
                this,
                640,
                560,
                "BACK TO ROADMAP",
                () => {
                    this.scene.start("LessonSelectScene", {
                        character: this.data.character,
                        characterName: this.data.characterName,
                    });
                },
                { width: 300 }
            );

            new Button(
                this,
                640,
                630,
                "RETURN TO MENU",
                () => {
                    this.scene.start("MenuScene");
                },
                { width: 260 }
            );

            return;
        }

        new Button(
            this,
            640,
            520,
            "RETRY EXAM",
            () => {
                this.scene.start("ExamScene", {
                    lesson: this.data.lesson,
                    character: this.data.character,
                    characterName: this.data.characterName,
                    battleScore: this.data.battleScore,
                    battleTotal: this.data.battleTotal,
                });
            },
            { width: 260 }
        );

        new Button(
            this,
            640,
            580,
            "CHOOSE ANOTHER LESSON",
            () => {
                this.scene.start("LessonSelectScene", {
                    character: this.data.character,
                    characterName: this.data.characterName,
                });
            },
            { width: 320 }
        );

        new Button(
            this,
            640,
            640,
            "RETURN TO MENU",
            () => {
                this.scene.start("MenuScene");
            },
            { width: 260 }
        );
    }
}
