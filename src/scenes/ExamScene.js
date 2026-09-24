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
    "responsive-web-design": { textureKey: "rwd-layout-gremlin", name: "Layout Gremlin", difficulty: 1 },
    javascript: { textureKey: "javascript-null-pointer-ooze", name: "Null Pointer Ooze", difficulty: 1.05 },
    "frontend-libraries": { textureKey: "framework-wyrm", name: "Framework Wyrm", difficulty: 1.1 },
    python: { textureKey: "python-indentation-imp", name: "Indentation Imp", difficulty: 1 },
    "relational-databases": { textureKey: "foreign-key-fiend", name: "Foreign Key Fiend", difficulty: 1.05 },
    "backend-apis": { textureKey: "api-archon", name: "API Archon", difficulty: 1.1 },
    "fullstack-exam": { textureKey: "full-stack-overlord", name: "The Full-Stack Overlord", difficulty: 1, fullStack: true },
};

const FULLSTACK_BOSSES = [
    {
        textureKey: "rwd-layout-gremlin",
        name: "Layout Gremlin",
        phaseTwoTextureKey: "second-phase-layout",
        phaseTwoName: "Grimrgid, Lord of Broken Layouts",
    },
    {
        textureKey: "python-indentation-imp",
        name: "Indentation Imp",
        phaseTwoTextureKey: "second-phase-indentation",
        phaseTwoName: "Indentrix, the Misaligned",
    },
    {
        textureKey: "javascript-null-pointer-ooze",
        name: "Null-Pointer Ooze",
        phaseTwoTextureKey: "second-phase-pointer",
        phaseTwoName: "Nullmire, the Pointer Eater",
    },
    {
        textureKey: "foreign-key-fiend",
        name: "Foreign Key Fiend",
        phaseTwoTextureKey: "second-phase-relations",
        phaseTwoName: "Keybane, Devourer of Broken Relations",
    },
    {
        textureKey: "framework-wyrm",
        name: "Framework Wyrm",
        phaseTwoTextureKey: "second-phase-library",
        phaseTwoName: "Wyrmframe, the Library Devourer",
    },
    {
        textureKey: "api-archon",
        name: "The API Archon",
        phaseTwoTextureKey: "second-phase-backend",
        phaseTwoName: "Apocalypt, Lord of the Backend",
    },
    {
        textureKey: "full-stack-overlord",
        name: "Cyberpunk Dragon Overlord",
        phaseTwoTextureKey: "second-phase-final",
        phaseTwoName: "Draconis Prime, Cyberpunk Full-Stack Dragon Overlord",
        finalBoss: true,
    },
];

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
        this.bossPhase = data.bossPhase ?? 1;
        this.examSectionIndex = data.examSectionIndex ?? 0;
        this.examCorrect = data.examCorrect ?? 0;
        this.examTotal = data.examTotal ?? 0;
    }

    create() {
        this.progressManager = new ProgressManager();

        if (this.awardsExperience) {
            this.progressManager.saveLessonCheckpoint(this.lesson.id, {
                stage: "exam",
                sectionIndex: this.lesson.sections.length,
                battleScore: this.battleScore,
                battleTotal: this.battleTotal,
                examSectionIndex: this.examSectionIndex,
                bossPhase: this.bossPhase,
                examCorrect: this.examCorrect,
                examTotal: this.examTotal,
            });
        }

        this.quizManager = new QuizManager(this.getExamQuestions());

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
        const baseBossConfig = this.getBaseBossConfig();
        const bossConfig = this.isFullStackExam()
            ? this.progressManager.scaleFullStackBossStats(baseBossConfig, this.getPhaseHitTarget())
            : this.progressManager.scaleEnemyStats(baseBossConfig, {
                isBoss: true,
                isFinalBoss: false,
            });
        this.boss = new Boss(this, 1020, 300, bossConfig);

        this.add.text(260, 200, `${this.characterName}  (Lv. ${this.player.level})`, {
            fontFamily: "Arial",
            fontSize: "18px",
            fontStyle: "bold",
            color: "#ffffff",
        }).setOrigin(0.5);

        this.bossNameLabel = this.add.text(1020, 200, this.boss.name, {
            fontFamily: "Arial",
            fontSize: "18px",
            fontStyle: "bold",
            color: "#ffffff",
        }).setOrigin(0.5);
    }

    isFullStackExam() {
        return this.lesson.id === CAPSTONE_LESSON;
    }

    getExamQuestions() {
        const questions = this.isFullStackExam()
            ? this.lesson.sections[this.examSectionIndex]?.exam ?? this.lesson.exam
            : this.lesson.exam;

        if (this.isFullStackExam()) {
            const copies = Math.ceil(this.getPhaseHitTarget() / questions.length);
            return Array.from({ length: copies }, () => questions).flat();
        }

        return questions;
    }

    getBaseBossConfig() {
        if (this.isFullStackExam()) {
            const boss = FULLSTACK_BOSSES[this.examSectionIndex];
            return this.bossPhase === 2
                ? {
                      ...boss,
                      textureKey: boss.phaseTwoTextureKey,
                      name: boss.phaseTwoName,
                  }
                : boss;
        }

        return BOSS_BY_LESSON[this.lesson.id] ?? BOSS_BY_LESSON.javascript;
    }

    getPhaseHitTarget() {
        const boss = FULLSTACK_BOSSES[this.examSectionIndex];
        return boss?.finalBoss
            ? this.bossPhase === 1 ? 15 : 30
            : this.bossPhase === 1 ? 5 : 12;
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
                    if (this.isFullStackExam()) {
                        this.boss.playDefeatAnimation(() => this.handleFullStackBossDefeat());
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
        // Each phase starts a fresh question pool so the hit target is reachable.
        this.bossPhase = 2;
        this.saveFullStackCheckpoint();
        this.quizManager = new QuizManager(this.getExamQuestions());
        const phaseTwoConfig = this.progressManager.scaleFullStackBossStats(
            this.getBaseBossConfig(),
            this.getPhaseHitTarget()
        );
        this.boss.transform(phaseTwoConfig);
        this.bossNameLabel.setText(this.boss.name);
        this.bossHealthBar.setHealth(this.boss.hp, this.boss.maxHp);

        this.showPhaseTransition(
            `PHASE 2: ${this.boss.name.toUpperCase()}`,
            "The boss has transformed and returned stronger.",
            () => this.nextQuestion()
        );
    }

    handleFullStackBossDefeat() {
        this.recordCurrentExamResults();

        if (this.bossPhase === 1) {
            this.startBossPhaseTwo();
            return;
        }

        if (this.examSectionIndex < FULLSTACK_BOSSES.length - 1) {
            this.startNextFullStackLesson();
            return;
        }

        this.finishExam();
    }

    recordCurrentExamResults() {
        const results = this.quizManager.getResults();
        this.examCorrect += results.correct;
        this.examTotal += results.total;
    }

    saveFullStackCheckpoint() {
        if (!this.awardsExperience || !this.isFullStackExam()) return;

        this.progressManager.saveLessonCheckpoint(this.lesson.id, {
            stage: "exam",
            sectionIndex: this.lesson.sections.length,
            battleScore: this.battleScore,
            battleTotal: this.battleTotal,
            examSectionIndex: this.examSectionIndex,
            bossPhase: this.bossPhase,
            examCorrect: this.examCorrect,
            examTotal: this.examTotal,
        });
    }

    startNextFullStackLesson() {
        this.progressManager.saveLessonCheckpoint(this.lesson.id, {
            stage: "lesson",
            sectionIndex: this.examSectionIndex + 1,
            battleScore: this.battleScore,
            battleTotal: this.battleTotal,
            examCorrect: this.examCorrect,
            examTotal: this.examTotal,
        });

        this.scene.start("LessonScene", {
            lesson: this.lesson,
            character: this.character,
            characterName: this.characterName,
            sectionIndex: this.examSectionIndex + 1,
            battleScore: this.battleScore,
            battleTotal: this.battleTotal,
            awardsExperience: this.awardsExperience,
            examCorrect: this.examCorrect,
            examTotal: this.examTotal,
        });
    }

    startNextFullStackBoss() {
        this.examSectionIndex += 1;
        this.bossPhase = 1;
        this.saveFullStackCheckpoint();
        this.quizManager = new QuizManager(this.getExamQuestions());

        const bossConfig = this.progressManager.scaleFullStackBossStats(
            this.getBaseBossConfig(),
            this.getPhaseHitTarget()
        );
        this.boss.transform(bossConfig);
        this.bossNameLabel.setText(this.boss.name);
        this.bossHealthBar.setHealth(this.boss.hp, this.boss.maxHp);

        this.showPhaseTransition(
            `NEXT BOSS: ${this.boss.name.toUpperCase()}`,
            "A new full-stack challenge approaches.",
            () => this.nextQuestion()
        );
    }

    showPhaseTransition(titleText, subtitleText, onContinue) {
        this.sound.stopAll();
        this.sound.play("bgm-battle", { loop: true, volume: 0.35 });

        const overlay = this.add
            .rectangle(640, 360, 780, 260, 0x1a0b1f, 0.97)
            .setStrokeStyle(2, 0xfacc15)
            .setDepth(10);

        const title = this.add
            .text(640, 300, titleText, {
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
            .text(640, 345, subtitleText, {
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
        const results = this.isFullStackExam()
            ? {
                  correct: this.examCorrect,
                  total: this.examTotal,
                  accuracy: this.examTotal === 0
                      ? 0
                      : Math.round((this.examCorrect / this.examTotal) * 100),
              }
            : this.quizManager.getResults();

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