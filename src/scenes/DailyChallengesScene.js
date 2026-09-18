import Phaser from "phaser";
import Button from "../ui/Button.js";
import QuestionPanel from "../ui/QuestionPanel.js";
import ProgressManager from "../systems/ProgressManager.js";

export default class DailyChallengesScene extends Phaser.Scene {
    constructor() {
        super("DailyChallengesScene");
    }

    init(data = {}) {
        this.character = data.character;
        this.characterName = data.characterName;
    }

    create() {
        this.progressManager = new ProgressManager();

        this.drawBackground();
        this.createHeader();
        this.createStatsPanel();
        this.createBackButton();

        this.loadChallenge();
    }

    drawBackground() {
        this.add.image(640, 360, "bg-dungeon").setDisplaySize(1280, 720);
        this.add.rectangle(640, 400, 1000, 560, 0x0b0f1a, 0.82).setStrokeStyle(2, 0xa855f7);
    }

    createHeader() {
        this.add
            .text(640, 80, "DAILY CODING CHALLENGE", {
                fontFamily: "Arial",
                fontSize: "32px",
                fontStyle: "bold",
                color: "#ffffff",
            })
            .setOrigin(0.5);

        this.add
            .text(640, 115, "A new question every day. Come back tomorrow for the next one!", {
                fontFamily: "Arial",
                fontSize: "15px",
                color: "#c4b5fd",
            })
            .setOrigin(0.5);
    }

    createStatsPanel() {
        const stats = this.progressManager.getDailyChallengeStats();

        this.statsText = this.add
            .text(
                640,
                155,
                `Current streak: ${stats.streak}   |   Best streak: ${stats.longestStreak}   |   Total solved: ${stats.totalSolved}`,
                {
                    fontFamily: "Arial",
                    fontSize: "15px",
                    fontStyle: "bold",
                    color: "#facc15",
                }
            )
            .setOrigin(0.5);
    }

    async loadChallenge() {
        try {
            const response = await fetch("/data/daily-challenges.json");

            if (!response.ok) {
                throw new Error(`Failed to load daily challenges (${response.status})`);
            }

            const data = await response.json();
            this.challenges = data.challenges;

            this.renderChallenge();
        } catch (error) {
            console.error(error);
            this.showError("Could not load today's challenge. Please try again later.");
        }
    }

    getTodayChallenge() {
        const daysSinceEpoch = Math.floor(Date.now() / 86400000);
        const index = daysSinceEpoch % this.challenges.length;
        return this.challenges[index];
    }

    renderChallenge() {
        const challenge = this.getTodayChallenge();
        const alreadyCompleted = this.progressManager.hasCompletedTodayChallenge();

        this.add
            .text(640, 200, `Topic: ${challenge.topic}`, {
                fontFamily: "Arial",
                fontSize: "14px",
                fontStyle: "bold",
                color: "#93c5fd",
            })
            .setOrigin(0.5);

        if (alreadyCompleted) {
            this.showAlreadyCompletedState(challenge);
            return;
        }

        this.questionPanel = new QuestionPanel(this, 640, 300, 900);
        this.questionPanel.showQuestion(challenge, (isCorrect) => this.handleAnswer(isCorrect));
    }

    handleAnswer(isCorrect) {
        this.sound.play(isCorrect ? "sfx-correct" : "sfx-incorrect", { volume: 0.6 });
        this.progressManager.recordDailyChallengeResult(isCorrect);

        const stats = this.progressManager.getDailyChallengeStats();
        this.statsText.setText(
            `Current streak: ${stats.streak}   |   Best streak: ${stats.longestStreak}   |   Total solved: ${stats.totalSolved}`
        );

        this.time.delayedCall(1400, () => {
            this.add
                .text(640, 560, "Nice work! Come back tomorrow for a new challenge.", {
                    fontFamily: "Arial",
                    fontSize: "16px",
                    fontStyle: "bold",
                    color: "#4ade80",
                })
                .setOrigin(0.5);
        });
    }

    showAlreadyCompletedState(challenge) {
        this.add
            .text(640, 280, "You've already solved today's challenge!", {
                fontFamily: "Arial",
                fontSize: "22px",
                fontStyle: "bold",
                color: "#4ade80",
            })
            .setOrigin(0.5);

        this.add
            .text(640, 330, challenge.question, {
                fontFamily: "Arial",
                fontSize: "18px",
                color: "#e2e8f0",
                align: "center",
                wordWrap: { width: 780 },
            })
            .setOrigin(0.5);

        this.add
            .text(640, 400, `Answer: ${challenge.choices[challenge.answer]}`, {
                fontFamily: "Arial",
                fontSize: "18px",
                fontStyle: "bold",
                color: "#facc15",
            })
            .setOrigin(0.5);

        this.add
            .text(640, 450, "A new question unlocks at midnight.", {
                fontFamily: "Arial",
                fontSize: "15px",
                color: "#94a3b8",
            })
            .setOrigin(0.5);
    }

    showError(message) {
        this.add
            .text(640, 300, message, {
                fontFamily: "Arial",
                fontSize: "16px",
                color: "#f87171",
                align: "center",
                wordWrap: { width: 700 },
            })
            .setOrigin(0.5);
    }

    createBackButton() {
        new Button(
            this,
            110,
            660,
            "BACK",
            () => {
                this.scene.start("LessonSelectScene", {
                    character: this.character,
                    characterName: this.characterName,
                });
            },
            { width: 160 }
        );
    }
}