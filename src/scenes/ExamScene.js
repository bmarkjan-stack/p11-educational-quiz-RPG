import Phaser from "phaser";
import QuestionPanel from "../ui/QuestionPanel.js";
import QuizManager from "../systems/QuizManager.js";
import ProgressManager from "../systems/ProgressManager.js";

const PASS_THRESHOLD = 80;

export default class ExamScene extends Phaser.Scene {
    constructor() {
        super("ExamScene");
    }

    init(data) {
        this.lesson = data.lesson;
        this.character = data.character;
        this.characterName = data.characterName;
        this.battleScore = data.battleScore ?? 0;
        this.battleTotal = data.battleTotal ?? 0;
    }

    create() {
        this.progressManager = new ProgressManager();
        this.quizManager = new QuizManager(this.lesson.exam);

        this.drawBackground();
        this.createHeader();
        this.questionPanel = new QuestionPanel(this, 640, 380, 900);

        this.time.delayedCall(200, () => this.nextQuestion());
    }

    drawBackground() {
        this.add.image(640, 360, "bg-classroom").setDisplaySize(1280, 720);
        this.add.rectangle(640, 380, 1000, 500, 0x0b0f1a, 0.8).setStrokeStyle(2, 0x5f74bd);
    }

    createHeader() {
        this.add
            .text(640, 90, `${this.lesson.title} \u2014 FINAL EXAM`, {
                fontFamily: "Arial",
                fontSize: "30px",
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

    nextQuestion() {
        if (this.quizManager.isComplete()) {
            this.finishExam();
            return;
        }

        const progress = this.quizManager.getProgress();
        this.progressLabel.setText(`Question ${progress.current} / ${progress.total}`);

        const question = this.quizManager.getCurrentQuestion();

        this.questionPanel.showQuestion(question, (isCorrect) => {
            this.sound.play(isCorrect ? "sfx-correct" : "sfx-incorrect", { volume: 0.6 });

            this.time.delayedCall(900, () => {
                this.quizManager.next();
                this.nextQuestion();
            });
        });
    }

    finishExam() {
        const results = this.quizManager.getResults();
        const passed = results.accuracy >= PASS_THRESHOLD;

        this.progressManager.markLessonComplete(this.lesson.id, {
            examScore: results.correct,
            accuracy: results.accuracy,
            passed,
        });

        this.sound.stopAll();
        this.sound.play(passed ? "bgm-victory" : "bgm-defeat", { volume: 0.5 });

        this.scene.start("ResultsScene", {
            lesson: this.lesson,
            character: this.character,
            characterName: this.characterName,
            battleScore: this.battleScore,
            battleTotal: this.battleTotal,
            examScore: results.correct,
            examTotal: results.total,
            accuracy: results.accuracy,
            passed,
        });
    }
}