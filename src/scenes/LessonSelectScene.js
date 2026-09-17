import Phaser from "phaser";
import Button from "../ui/Button.js";
import LessonManager from "../systems/LessonManager.js";
import ProgressManager from "../systems/ProgressManager.js";
import { TRACKS, CAPSTONE_LESSON, LESSON_DISPLAY_NAMES } from "../systems/curriculum.js";

const NODE_WIDTH = 260;
const NODE_HEIGHT = 100;
const NODE_GAP_Y = 120;
const TRACK_START_Y = 175;

export default class LessonSelectScene extends Phaser.Scene {
    constructor() {
        super("LessonSelectScene");
    }

    init(data = {}) {
        this.character = data.character ?? "male";
        this.characterName = data.characterName ?? "Adventurer";
    }

    create() {
        this.lessonManager = new LessonManager();
        this.progressManager = new ProgressManager();
        this.progressManager.setCharacter(this.character, this.characterName);

        this.drawBackground();
        this.createTitle();
        this.createTracks();
        this.createLessonNode();
        this.createCapstoneNode();
        this.createBackButton();
    }

    drawBackground() {
        this.add.image(640, 360, "bg-classroom").setDisplaySize(1280, 720);
    }

    createTitle() {
        this.add
            .text(640, 55, "FULL-STACK ROADMAP", {
                fontFamily: "Arial",
                fontSize: "34px",
                fontStyle: "bold",
                color: "#ffffff",
            })
            .setOrigin(0.5);

        this.add
            .text(640, 92, `Pick a track to continue, ${this.characterName}.`, {
                fontFamily: "Arial",
                fontSize: "16px",
                color: "#c7d2fe",
            })
            .setOrigin(0.5);
    }

    createTracks() {
        const columnX = { frontend: 340, backend: 940 };
        const startY = TRACK_START_Y;

        TRACKS.forEach((track) => {
            const x = columnX[track.id];

            this.add
                .text(x, startY - 40, track.title.toUpperCase(), {
                    fontFamily: "Arial",
                    fontSize: "20px",
                    fontStyle: "bold",
                    color: track.id === "frontend" ? "#93c5fd" : "#86efac",
                })
                .setOrigin(0.5);

            track.lessons.forEach((lessonId, index) => {
                const y = startY + index * NODE_GAP_Y;

                if (index > 0) {
                    this.drawConnector(x, y - NODE_GAP_Y + NODE_HEIGHT / 2, x, y - NODE_HEIGHT / 2);
                }

                this.createLessonNode(x, y, lessonId, index + 1);
            });
        });
    }

    drawConnector(x1, y1, x2, y2) {
        const graphics = this.add.graphics();
        graphics.lineStyle(3, 0x5f74bd, 0.8);
        graphics.beginPath();
        graphics.moveTo(x1, y1);
        graphics.lineTo(x2, y2);
        graphics.strokePath();
    }

    createLessonNode(x, y, lessonId, stepNumber) {
        const status = this.progressManager.getLessonStatus(lessonId);
        const unlocked = !!status?.unlocked;
        const completed = !!status?.completed;
        const title = LESSON_DISPLAY_NAMES[lessonId] ?? lessonId;

        const fillColor = completed ? 0x14532d : unlocked ? 0x111827 : 0x0b0f1a;
        const strokeColor = completed ? 0x22c55e : unlocked ? 0x5f74bd : 0x334155;

        const node = this.add
            .rectangle(x, y, NODE_WIDTH, NODE_HEIGHT, fillColor, 0.94)
            .setStrokeStyle(2, strokeColor);

        this.add
            .text(x - NODE_WIDTH / 2 + 16, y - NODE_HEIGHT / 2 + 10, `STEP ${stepNumber}`, {
                fontFamily: "Arial",
                fontSize: "12px",
                fontStyle: "bold",
                color: unlocked ? "#94a3b8" : "#4b5563",
            });

        this.add
            .text(x, y - 6, title, {
                fontFamily: "Arial",
                fontSize: "18px",
                fontStyle: "bold",
                color: unlocked ? "#ffffff" : "#64748b",
                align: "center",
                wordWrap: { width: NODE_WIDTH - 30 },
            })
            .setOrigin(0.5);

        this.add
            .text(x, y + NODE_HEIGHT / 2 - 16, completed ? "\u2605 Completed" : unlocked ? "Available" : "Locked", {
                fontFamily: "Arial",
                fontSize: "13px",
                fontStyle: "bold",
                color: completed ? "#facc15" : unlocked ? "#4ade80" : "#64748b",
            })
            .setOrigin(0.5);

        if (unlocked) {
            node.setInteractive({ useHandCursor: true });
            node.on("pointerover", () => node.setStrokeStyle(3, 0x8da2e8));
            node.on("pointerout", () => node.setStrokeStyle(2, strokeColor));
            node.on("pointerdown", () => this.selectLesson(lessonId));
        }
    }

    createCapstoneNode() {
        const status = this.progressManager.getLessonStatus(CAPSTONE_LESSON);
        const unlocked = !!status?.unlocked;
        const completed = !!status?.completed;

        const x = 640;
        const y = 545;

        this.drawConnector(340, TRACK_START_Y + 2 * NODE_GAP_Y + NODE_HEIGHT / 2, x - 220, y);
        this.drawConnector(940, TRACK_START_Y + 2 * NODE_GAP_Y + NODE_HEIGHT / 2, x + 220, y);

        const fillColor = completed ? 0x78350f : unlocked ? 0x1e1033 : 0x0b0f1a;
        const strokeColor = completed ? 0xfacc15 : unlocked ? 0xa855f7 : 0x334155;

        const node = this.add
            .rectangle(x, y, 460, 90, fillColor, 0.96)
            .setStrokeStyle(3, strokeColor);

        this.add
            .text(x, y - 18, "\u2694 FULL-STACK EXAM \u2694", {
                fontFamily: "Arial",
                fontSize: "22px",
                fontStyle: "bold",
                color: unlocked ? "#ffffff" : "#64748b",
            })
            .setOrigin(0.5);

        this.add
            .text(
                x,
                y + 14,
                completed
                    ? "\u2605 Completed \u2014 You are a Full-Stack Developer!"
                    : unlocked
                    ? "The final boss awaits. Available now."
                    : "Locked \u2014 complete both tracks first.",
                {
                    fontFamily: "Arial",
                    fontSize: "14px",
                    color: completed ? "#facc15" : unlocked ? "#c4b5fd" : "#64748b",
                }
            )
            .setOrigin(0.5);

        if (unlocked) {
            node.setInteractive({ useHandCursor: true });
            node.on("pointerover", () => node.setStrokeStyle(4, 0xd8b4fe));
            node.on("pointerout", () => node.setStrokeStyle(3, strokeColor));
            node.on("pointerdown", () => this.selectLesson(CAPSTONE_LESSON));
        }
    }

    async selectLesson(lessonId) {
        try {
            const lesson = await this.lessonManager.loadLesson(lessonId);

            this.scene.start("LessonScene", {
                lesson,
                character: this.character,
                characterName: this.characterName,
            });
        } catch (error) {
            console.error(error);
            this.showError("Could not load this lesson. Please try again.");
        }
    }

    showError(message) {
        const text = this.add
            .text(640, 706, message, {
                fontFamily: "Arial",
                fontSize: "15px",
                color: "#f87171",
            })
            .setOrigin(0.5);

        this.time.delayedCall(2500, () => text.destroy());
    }

    createBackButton() {
        new Button(
            this,
            95,
            40,
            "BACK",
            () => {
                this.scene.start("CharacterSelectScene");
            },
            { width: 130, height: 40, fontSize: "16px" }
        );
    }
}
