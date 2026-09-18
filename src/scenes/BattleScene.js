import Phaser from "phaser";
import Player from "../entities/Player.js";
import Boss from "../entities/Boss.js";
import HealthBar from "../ui/HealthBar.js";
import QuestionPanel from "../ui/QuestionPanel.js";
import Button from "../ui/Button.js";
import QuizManager from "../systems/QuizManager.js";
import ProgressManager from "../systems/ProgressManager.js";

// The "real" boss for each lesson — fought only in that lesson's FINAL section.
const BOSS_BY_LESSON = {
    "responsive-web-design": { textureKey: "boss1-slime", name: "Layout Gremlin", maxHp: 90, attackPower: 7 },
    "javascript": { textureKey: "boss1-slime", name: "Null Pointer Ooze", maxHp: 105, attackPower: 8 },
    "frontend-libraries": { textureKey: "final-boss-dragon", name: "Framework Wyrm", maxHp: 140, attackPower: 11 },

    "python": { textureKey: "boss1-slime", name: "Indentation Imp", maxHp: 95, attackPower: 7 },
    "relational-databases": { textureKey: "boss1-slime", name: "Foreign Key Fiend", maxHp: 110, attackPower: 8 },
    "backend-apis": { textureKey: "final-boss-dragon", name: "Endpoint Hydra", maxHp: 145, attackPower: 11 },

    "fullstack-exam": { textureKey: "final-boss-dragon", name: "The Full-Stack Overlord", maxHp: 200, attackPower: 14 },
};

// A smaller, weaker enemy used for every section battle that ISN'T the final one.
const SECTION_ENEMY = { textureKey: "boss1-slime", maxHp: 40, attackPower: 5 };

export default class BattleScene extends Phaser.Scene {
    constructor() {
        super("BattleScene");
    }

    init(data) {
        this.lesson = data.lesson;
        this.character = data.character;
        this.characterName = data.characterName;
        this.sectionIndex = data.sectionIndex ?? 0;

        // Cumulative correct/total carried in from earlier section battles in this lesson.
        this.priorBattleScore = data.battleScore ?? 0;
        this.priorBattleTotal = data.battleTotal ?? 0;
    }

    create() {
        this.progressManager = new ProgressManager();

        const section = this.lesson.sections[this.sectionIndex];
        this.isFinalSection = this.sectionIndex === this.lesson.sections.length - 1;
        this.quizManager = new QuizManager(section.quiz);

        this.drawBackground();
        this.createCombatants(section);
        this.createHealthBars();
        this.createQuestionPanel();

        this.nextQuestion();
    }

    drawBackground() {
        this.add.image(640, 360, "bg-dungeon").setDisplaySize(1280, 720);
    }

    createCombatants(section) {
        this.player = new Player(this, 260, 300, this.character, this.characterName);

        const bossConfig = this.isFinalSection
            ? BOSS_BY_LESSON[this.lesson.id] ?? BOSS_BY_LESSON.javascript
            : { ...SECTION_ENEMY, name: `${section.title} Sprite` };

        this.boss = new Boss(this, 1020, 300, bossConfig);

        this.add
            .text(260, 200, this.characterName, {
                fontFamily: "Arial",
                fontSize: "18px",
                fontStyle: "bold",
                color: "#ffffff",
            })
            .setOrigin(0.5);

        this.add
            .text(1020, 200, this.boss.name, {
                fontFamily: "Arial",
                fontSize: "18px",
                fontStyle: "bold",
                color: "#ffffff",
            })
            .setOrigin(0.5);
    }

    createHealthBars() {
        this.playerHealthBar = new HealthBar(this, 130, 230, 260, 24, this.player.maxHp);
        this.bossHealthBar = new HealthBar(this, 890, 230, 260, 24, this.boss.maxHp);
    }

    createQuestionPanel() {
        this.questionPanel = new QuestionPanel(this, 640, 460, 900);
    }

    nextQuestion() {
        if (this.quizManager.isComplete()) {
            this.endBattle();
            return;
        }

        const question = this.quizManager.getCurrentQuestion();
        this.questionPanel.showQuestion(question, (isCorrect) => this.resolveTurn(isCorrect));
    }

    resolveTurn(isCorrect) {
        this.sound.play(isCorrect ? "sfx-correct" : "sfx-incorrect", { volume: 0.6 });

        if (isCorrect) {
            this.player.attack(this.boss);
            this.sound.play("sfx-player-attack", { volume: 0.4 });
        } else {
            this.boss.attack(this.player);
            this.sound.play("sfx-boss-attack", { volume: 0.4 });
        }

        this.time.delayedCall(400, () => {
            this.playerHealthBar.setHealth(this.player.hp, this.player.maxHp);
            this.bossHealthBar.setHealth(this.boss.hp, this.boss.maxHp);

            if (!this.boss.isAlive()) {
                this.boss.playDefeatAnimation(() => this.endBattle());
                return;
            }

            if (!this.player.isAlive()) {
                this.showDefeat();
                return;
            }

            this.quizManager.next();
            this.time.delayedCall(300, () => this.nextQuestion());
        });
    }

    endBattle() {
        const results = this.quizManager.getResults();
        const cumulativeScore = this.priorBattleScore + results.correct;
        const cumulativeTotal = this.priorBattleTotal + results.total;

        this.progressManager.recordBattleResult(this.lesson.id, cumulativeScore);
        this.sound.stopAll();

        if (this.isFinalSection) {
            this.scene.start("ExamScene", {
                lesson: this.lesson,
                character: this.character,
                characterName: this.characterName,
                battleScore: cumulativeScore,
                battleTotal: cumulativeTotal,
            });
        } else {
            this.scene.start("LessonScene", {
                lesson: this.lesson,
                character: this.character,
                characterName: this.characterName,
                sectionIndex: this.sectionIndex + 1,
                battleScore: cumulativeScore,
                battleTotal: cumulativeTotal,
            });
        }
    }

    showDefeat() {
        this.sound.stopAll();
        this.sound.play("bgm-defeat", { volume: 0.5 });

        const overlay = this.add
            .rectangle(640, 360, 700, 260, 0x070b18, 0.97)
            .setStrokeStyle(2, 0xdc2626)
            .setDepth(10);

        this.add
            .text(640, 320, "YOU WERE DEFEATED", {
                fontFamily: "Arial",
                fontSize: "30px",
                fontStyle: "bold",
                color: "#f87171",
            })
            .setOrigin(0.5)
            .setDepth(11);

        const retryButton = new Button(
            this,
            640,
            400,
            "RETRY BATTLE",
            () => {
                // Retry only THIS section's battle — prior sections' scores stay banked.
                this.scene.restart({
                    lesson: this.lesson,
                    character: this.character,
                    characterName: this.characterName,
                    sectionIndex: this.sectionIndex,
                    battleScore: this.priorBattleScore,
                    battleTotal: this.priorBattleTotal,
                });
            },
            { width: 220 }
        );

        retryButton.setDepth(11);
    }
}
