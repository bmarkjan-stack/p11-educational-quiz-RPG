import Phaser from "phaser";
import Player from "../entities/Player.js";
import Boss from "../entities/Boss.js";
import HealthBar from "../ui/HealthBar.js";
import ExperienceBar from "../ui/ExperienceBar.js";
import QuestionPanel from "../ui/QuestionPanel.js";
import Button from "../ui/Button.js";
import QuizManager from "../systems/QuizManager.js";
import ProgressManager from "../systems/ProgressManager.js";
import { CAPSTONE_LESSON } from "../systems/curriculum.js";

// Boss challenges award more XP than a regular section quiz (requirement #5).
const EXAM_XP_REWARD = 50;

const BOSS_BY_LESSON = {
    "responsive-web-design": { textureKey: "rwd-layout-gremlin", name: "Layout Gremlin", maxHp: 175, attackPower: 7 },
    javascript: { textureKey: "javascript-null-pointer-ooze", name: "Null Pointer Ooze", maxHp: 105, attackPower: 8 },
    "frontend-libraries": { textureKey: "framework-wyrm", name: "Framework Wyrm", maxHp: 140, attackPower: 11 },
    python: { textureKey: "python-indentation-imp", name: "Indentation Imp", maxHp: 175, attackPower: 7 },
    "relational-databases": { textureKey: "foreign-key-fiend", name: "Foreign Key Fiend", maxHp: 110, attackPower: 8 },
    "backend-apis": { textureKey: "api-archon", name: "API Archon", maxHp: 145, attackPower: 11 },
    "fullstack-exam": { textureKey: "full-stack-overlord", name: "The Full-Stack Overlord", maxHp: 200, attackPower: 14 },
};

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
        this.awardsExperience = data.awardsExperience ?? true;
        this.bossPhase = 1;
    }

    create() {
        this.progressManager = new ProgressManager();

        if (this.awardsExperience) {
            this.progressManager.saveLessonCheckpoint(this.lesson.id, {
                stage: "exam",
                sectionIndex: this.lesson.sections.length,
                battleScore: this.battleScore,
                battleTotal: this.battleTotal,
            });
        }

        this.quizManager = new QuizManager(this.lesson.exam);

        this.drawBackground();
        this.createCombatants();
        this.createHealthBars();
        this.createHeader();
        this.createExitButton();
        this.questionPanel = new QuestionPanel(this, 640, 500, 900);
        this.playMusic();

        this.time.delayedCall(200, () => this.nextQuestion());
    }

    createExitButton() {
        new Button(
            this,
            140,
            68,
            "EXIT",
            () => {
                this.scene.start("LessonSelectScene", {
                    character: this.character,
                    characterName: this.characterName,
                });
            },
            { width: 140, height: 40, fontSize: "16px" }
        );
    }

    drawBackground() {
        this.add.image(640, 360, "bg-dungeon").setDisplaySize(1280, 720);
    }

    createCombatants() {
        const stats = this.progressManager.getCharacterStats();
        this.player = new Player(this, 260, 300, this.character, this.characterName, stats);
        const bossConfig = BOSS_BY_LESSON[this.lesson.id] ?? BOSS_BY_LESSON.javascript;
        this.boss = new Boss(this, 1020, 300, bossConfig);

        this.add.text(260, 200, `${this.characterName}  (Lv. ${this.player.level})`, {
            fontFamily: "Arial",
            fontSize: "18px",
            fontStyle: "bold",
            color: "#ffffff",
        }).setOrigin(0.5);

        this.add.text(1020, 200, this.boss.name, {
            fontFamily: "Arial",
            fontSize: "18px",
            fontStyle: "bold",
            color: "#ffffff",
        }).setOrigin(0.5);
    }

    createHealthBars() {
        this.playerHealthBar = new HealthBar(this, 130, 230, 260, 24, this.player.maxHp);
        const stats = this.progressManager.getCharacterStats();
        this.playerExperienceBar = new ExperienceBar(
            this,
            130,
            268,
            260,
            14,
            stats.xp,
            stats.xpToNextLevel
        );
        this.bossHealthBar = new HealthBar(this, 890, 230, 260, 24, this.boss.maxHp);
    }

    playMusic() {
        this.sound.stopAll();
        this.sound.play("bgm-battle", { loop: true, volume: 0.35 });
    }

    createHeader() {
        this.add
            .text(640, 90, `${this.lesson.title} \u2014 FINAL BOSS EXAM`, {
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
            this.showBattleIncomplete();
            return;
        }

        const progress = this.quizManager.getProgress();
        this.progressLabel.setText(`Exam question ${progress.current} / ${progress.total}`);

        const question = this.quizManager.getCurrentQuestion();

        this.questionPanel.showQuestion(question, (isCorrect, selectedIndex) => {
            this.quizManager.checkAnswer(selectedIndex);
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
                    
                    if (this.lesson.id === CAPSTONE_LESSON && this.bossPhase === 1) {
                        this.boss.playDefeatAnimation(() => this.startBossPhaseTwo());
                        return;
                    }
                    
                    this.boss.playDefeatAnimation(() => this.finishExam());
                    return;
                }

                if (!this.player.isAlive()) {
                    this.showDefeat();
                    return;
                }

                this.quizManager.next({ repeatCurrent: !isCorrect });
                this.nextQuestion();
            });
        });
    }

    startBossPhaseTwo() {
        // The question that just defeated phase 1 was correct — advance
        // past it (without re-queueing it) before continuing.
        this.quizManager.next({ repeatCurrent: false });

        this.bossPhase = 2;
        this.boss.hp = this.boss.maxHp;
        this.boss.attackPower += 3;
        this.boss.sprite.setAlpha(1).setScale(this.boss.scale);
        this.bossHealthBar.setHealth(this.boss.hp, this.boss.maxHp);

        this.showPhaseTransition(() => this.nextQuestion());
    }

    showPhaseTransition(onContinue) {
        this.sound.stopAll();
        this.sound.play("bgm-battle", { loop: true, volume: 0.35 });

        const overlay = this.add
            .rectangle(640, 360, 780, 260, 0x1a0b1f, 0.97)
            .setStrokeStyle(2, 0xfacc15)
            .setDepth(10);

        const title = this.add
            .text(640, 300, "THE FULL-STACK OVERLORD RISES AGAIN!", {
                fontFamily: "Arial",
                fontSize: "26px",
                fontStyle: "bold",
                color: "#facc15",
                align: "center",
                wordWrap: { width: 720 },
            })
            .setOrigin(0.5)
            .setDepth(11);

        const subtitle = this.add
            .text(640, 345, "Phase 2 \u2014 the boss has fully healed and hits harder!", {
                fontFamily: "Arial",
                fontSize: "17px",
                color: "#e2e8f0",
                align: "center",
                wordWrap: { width: 700 },
            })
            .setOrigin(0.5)
            .setDepth(11);

        const continueButton = new Button(
            this,
            640,
            410,
            "CONTINUE",
            () => {
                overlay.destroy();
                title.destroy();
                subtitle.destroy();
                continueButton.destroy();
                onContinue();
            },
            { width: 260 }
        );

        continueButton.setDepth(11);
    }

    finishExam() {
        const results = this.quizManager.getResults();

        this.progressManager.markLessonComplete(this.lesson.id, {
            examScore: results.correct,
            accuracy: results.accuracy,
            passed: true,
        });

        // requirement #5: boss challenges grant more XP than a normal
        // quiz — but only the first time the lesson is completed.
        const xpResult = this.awardsExperience
            ? this.progressManager.addExperience(EXAM_XP_REWARD)
            : null;
        const currentStats = xpResult?.stats ?? this.progressManager.getCharacterStats();

        this.sound.stopAll();
        this.sound.play("bgm-victory", { volume: 0.5 });

        this.scene.start("ResultsScene", {
            lesson: this.lesson,
            character: this.character,
            characterName: this.characterName,
            battleScore: this.battleScore,
            battleTotal: this.battleTotal,
            examScore: results.correct,
            examTotal: results.total,
            accuracy: results.accuracy,
            passed: true,
            awardsExperience: this.awardsExperience,
            xpGained: this.awardsExperience ? EXAM_XP_REWARD : 0,
            leveledUp: !!xpResult?.leveledUp,
            newLevel: xpResult?.stats?.level ?? null,
            maxHpGained: xpResult?.maxHpGained ?? 0,
            damageGained: xpResult?.damageGained ?? 0,
            currentStats,
        });
    }

    showBattleIncomplete() {
        this.sound.stopAll();
        this.sound.play("bgm-defeat", { volume: 0.5 });

        this.add.rectangle(640, 360, 700, 260, 0x070b18, 0.97).setStrokeStyle(2, 0xfacc15).setDepth(10);
        this.add.text(640, 300, "EXAM INCOMPLETE", {
            fontFamily: "Arial",
            fontSize: "30px",
            fontStyle: "bold",
            color: "#facc15",
        }).setOrigin(0.5).setDepth(11);
        this.add.text(640, 345, "Defeat the boss to complete the lesson.", {
            fontFamily: "Arial",
            fontSize: "18px",
            color: "#e2e8f0",
        }).setOrigin(0.5).setDepth(11);

        const retryButton = new Button(this, 640, 410, "RETRY EXAM", () => {
            this.scene.restart({
                lesson: this.lesson,
                character: this.character,
                characterName: this.characterName,
                battleScore: this.battleScore,
                battleTotal: this.battleTotal,
                awardsExperience: this.awardsExperience,
            });
        }, { width: 220 });
        retryButton.setDepth(11);
    }

    showDefeat() {
        this.sound.stopAll();
        this.sound.play("bgm-defeat", { volume: 0.5 });

        this.add.rectangle(640, 360, 700, 260, 0x070b18, 0.97).setStrokeStyle(2, 0xdc2626).setDepth(10);
        this.add.text(640, 320, "YOU WERE DEFEATED", {
            fontFamily: "Arial",
            fontSize: "30px",
            fontStyle: "bold",
            color: "#f87171",
        }).setOrigin(0.5).setDepth(11);

        const retryButton = new Button(this, 640, 400, "RETRY EXAM", () => {
            this.scene.restart({
                lesson: this.lesson,
                character: this.character,
                characterName: this.characterName,
                battleScore: this.battleScore,
                battleTotal: this.battleTotal,
                awardsExperience: this.awardsExperience,
            });
        }, { width: 220 });
        retryButton.setDepth(11);
    }
}