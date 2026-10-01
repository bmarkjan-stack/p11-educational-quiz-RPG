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
import { applyFloatyText } from "../ui/sceneEffects.js";

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
        this.exitConfirmation = null;
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
        this.fullStackSectionCorrect = data.fullStackSectionCorrect ?? 0;
        this.fullStackSectionTotal = data.fullStackSectionTotal ?? 0;
        this.recordedQuizCorrect = 0;
        this.recordedQuizTotal = 0;
    }

    create() {
        applyFloatyText(this);
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
                fullStackSectionCorrect: this.fullStackSectionCorrect,
                fullStackSectionTotal: this.fullStackSectionTotal,
            });
        }

        this.quizManager = new QuizManager(this.getExamQuestions());

        this.drawBackground();
        this.createTitle();
        this.createCombatants();
        this.createHealthBars();
        this.createHeader();
        this.createExitButton();
        this.questionPanel = new QuestionPanel(this);
        this.playMusic();

        this.time.delayedCall(200, () => this.nextQuestion());
    }

    createTitle() {
        this.add
            .image(640, 360, "exam-panel-title")
            .setOrigin(0.5);
    }

    createExitButton() {
        this.exitButton = new Button(
            this,
            140,
            68,
            "EXIT",
            () => this.showExitConfirmation(),
            { width: 140, height: 40, fontSize: "16px" }
        );
    }

    showExitConfirmation({ resumeQuestion = true } = {}) {
        if (this.exitConfirmation) return;
        this.questionPanel.pauseTimer();
        this.questionPanel.disable();

        const dimmer = this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.75)
            .setInteractive()
            .setDepth(20);
        const panel = this.add.image(640, 360, "result-panel")
            .setOrigin(0.5)
            .setDepth(21);
        const message = this.add.text(640, 315, "Are you sure you want to leave? Progress will not be saved.", {
            fontFamily: "Arial",
            fontSize: "20px",
            color: "#ffffff",
            align: "center",
            wordWrap: { width: 620 },
        }).setOrigin(0.5).setDepth(22);

        const exitButton = new Button(this, 500, 410, "EXIT", () => {
            this.scene.start("LessonSelectScene", {
                character: this.character,
                characterName: this.characterName,
            });
        }, { width: 220 });
        const continueButton = new Button(this, 780, 410, "CONTINUE", () => {
            dimmer.destroy();
            panel.destroy();
            message.destroy();
            exitButton.destroy();
            continueButton.destroy();
            this.exitConfirmation = null;
            if (resumeQuestion) {
                this.questionPanel.enable();
                this.questionPanel.resumeTimer();
            }
        }, { width: 220 });
        exitButton.setDepth(22);
        continueButton.setDepth(22);
        this.exitConfirmation = { dimmer, panel, message, exitButton, continueButton };
    }

    drawBackground() {
        const backgroundKey = `bg-quiz-${this.lesson.id}`;
        const textureKey = this.textures.exists(backgroundKey)
            ? backgroundKey
            : "bg-dungeon";
        this.add.image(640, 360, textureKey).setDisplaySize(1280, 720);
    }

    createCombatants() {
        const stats = this.progressManager.getCharacterStats();
        this.player = new Player(this, 325, 350, this.character, this.characterName, stats);
        const baseBossConfig = this.getBaseBossConfig();
        const bossConfig = this.isFullStackExam()
            ? this.progressManager.scaleFullStackBossStats(
                baseBossConfig,
                this.getPhaseHitTarget(),
                this.getPlayerHitsToDefeat()
            )
            : this.progressManager.scaleEnemyStats(baseBossConfig, {
                isBoss: true,
                isFinalBoss: false,
            });
        this.boss = new Boss(this, 940, 305, { ...bossConfig, scale: 0.90 });

        this.add.text(325, 200, `${this.characterName}  (Lv. ${this.player.level})`, {
            fontFamily: "LearnQuest",
            fontSize: "18px",
            fontStyle: "bold",
            color: "#ffffff",
        }).setOrigin(0.5);

        this.bossNameLabel = this.add.text(940, 120, this.boss.name, {
            fontFamily: "LearnQuest",
            fontSize: "26px",
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
            const totalHitTarget = FULLSTACK_BOSSES[this.examSectionIndex]?.finalBoss ? 45 : 15;
            const copies = Math.ceil(totalHitTarget / questions.length);
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
            : this.bossPhase === 1 ? 5 : 10;
    }

    // Full-stack bosses kill the player in 8 hits; the final boss in 16.
    getPlayerHitsToDefeat() {
        return FULLSTACK_BOSSES[this.examSectionIndex]?.finalBoss ? 16 : 8;
    }

    createHealthBars() {
        this.playerHealthBar = new HealthBar(this, 195, 230, 260, 24, this.player.maxHp);
        const stats = this.progressManager.getCharacterStats();
        this.playerExperienceBar = new ExperienceBar(
            this, 195, 256, 260, 14,
            stats.xp,
            stats.xpToNextLevel
        );
        this.bossHealthBar = new HealthBar(this, 785, 160, 310, 32, this.boss.maxHp);
    }

    playMusic() {
        this.sound.stopAll();
        this.sound.play("bgm-battle", { loop: true, volume: 0.35 });
    }

    createHeader() {
        this.add
            .text(640, 50, `${this.lesson.title} \u2014 FINAL BOSS EXAM`, {
                fontFamily: "Arial",
                fontSize: "16px",
                fontStyle: "bold",
                color: "#ffffff",
            })
            .setOrigin(0.5);

        this.progressLabel = this.add
            .text(640, 85, "", {
                fontFamily: "Arial",
                fontSize: "12px",
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

        this.questionPanel.showQuestion(question, (isCorrect, selectedIndex, timedOut) =>
            this.resolveTurn(isCorrect, selectedIndex, timedOut)
        );
    }

    resolveTurn(isCorrect, selectedIndex, timedOut = false) {
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

            this.quizManager.next({ repeatCurrent: !isCorrect && !timedOut });
            this.nextQuestion();
        });
    }

    startBossPhaseTwo() {
        this.bossPhase = 2;
        this.saveFullStackCheckpoint();
        const phaseTwoConfig = this.progressManager.scaleFullStackBossStats(
            this.getBaseBossConfig(),
            this.getPhaseHitTarget(),
            this.getPlayerHitsToDefeat()
        );
        // Phase 2: the player regains full health.
        this.player.hp = this.player.maxHp;
        this.playerHealthBar.setHealth(this.player.hp, this.player.maxHp);
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

        if (this.examSectionIndex < this.lesson.sections.length) {
            this.showFullStackSectionResults();
            return;
        }

        if (this.examSectionIndex < FULLSTACK_BOSSES.length - 1) {
            this.startNextFullStackBoss();
            return;
        }

        this.finishExam();
    }

    showFullStackSectionResults() {
        const nextExamSectionIndex = this.examSectionIndex + 1;
        const startsFinalBoss = nextExamSectionIndex >= this.lesson.sections.length;
        const nextScene = startsFinalBoss ? "ExamScene" : "LessonScene";
        const nextSceneData = startsFinalBoss
            ? {
                  lesson: this.lesson,
                  character: this.character,
                  characterName: this.characterName,
                  awardsExperience: this.awardsExperience,
                  examSectionIndex: nextExamSectionIndex,
                  bossPhase: 1,
                  examCorrect: this.examCorrect,
                  examTotal: this.examTotal,
              }
            : {
                  lesson: this.lesson,
                  character: this.character,
                  characterName: this.characterName,
                  sectionIndex: nextExamSectionIndex,
                  battleScore: this.battleScore,
                  battleTotal: this.battleTotal,
                  awardsExperience: this.awardsExperience,
                  examCorrect: this.examCorrect,
                  examTotal: this.examTotal,
              };

        if (this.awardsExperience) {
            this.progressManager.saveLessonCheckpoint(this.lesson.id, startsFinalBoss
                ? {
                      stage: "exam",
                      sectionIndex: this.lesson.sections.length,
                      battleScore: this.battleScore,
                      battleTotal: this.battleTotal,
                      examSectionIndex: nextExamSectionIndex,
                      bossPhase: 1,
                      examCorrect: this.examCorrect,
                      examTotal: this.examTotal,
                      fullStackSectionCorrect: 0,
                      fullStackSectionTotal: 0,
                  }
                : {
                      stage: "lesson",
                      sectionIndex: nextExamSectionIndex,
                      battleScore: this.battleScore,
                      battleTotal: this.battleTotal,
                      examCorrect: this.examCorrect,
                      examTotal: this.examTotal,
                  });
        }

        const xpResult = this.awardsExperience
            ? this.progressManager.addExperience(EXAM_XP_REWARD)
            : null;
        const currentStats = xpResult?.stats ?? this.progressManager.getCharacterStats();
        const accuracy = this.fullStackSectionTotal === 0
            ? 0
            : Math.round((this.fullStackSectionCorrect / this.fullStackSectionTotal) * 100);

        this.sound.stopAll();
        this.sound.play("bgm-victory", { volume: 0.5 });
        this.scene.start("ResultsScene", {
            lesson: this.lesson,
            character: this.character,
            characterName: this.characterName,
            battleScore: this.battleScore,
            battleTotal: this.battleTotal,
            examScore: this.fullStackSectionCorrect,
            examTotal: this.fullStackSectionTotal,
            accuracy,
            passed: true,
            awardsExperience: this.awardsExperience,
            xpGained: this.awardsExperience ? EXAM_XP_REWARD : 0,
            leveledUp: !!xpResult?.leveledUp,
            newLevel: xpResult?.stats?.level ?? null,
            maxHpGained: xpResult?.maxHpGained ?? 0,
            damageGained: xpResult?.damageGained ?? 0,
            currentStats,
            isCapstoneSectionResult: true,
            sectionTitle: this.lesson.sections[this.examSectionIndex].title,
            nextScene,
            nextSceneData,
        });
    }

    recordCurrentExamResults() {
        const results = this.quizManager.getResults();
        const correctSinceLastRecord = results.correct - this.recordedQuizCorrect;
        const totalSinceLastRecord = results.total - this.recordedQuizTotal;
        this.examCorrect += correctSinceLastRecord;
        this.examTotal += totalSinceLastRecord;
        this.fullStackSectionCorrect += correctSinceLastRecord;
        this.fullStackSectionTotal += totalSinceLastRecord;
        this.recordedQuizCorrect = results.correct;
        this.recordedQuizTotal = results.total;
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
            fullStackSectionCorrect: this.fullStackSectionCorrect,
            fullStackSectionTotal: this.fullStackSectionTotal,
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
            this.getPhaseHitTarget(),
            this.getPlayerHitsToDefeat()
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
            .image(640, 360, "result-panel")
            .setOrigin(0.5)
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

        this.add.image(640, 360, "result-panel").setOrigin(0.5).setDepth(10);
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

        this.add.image(640, 360, "result-panel").setOrigin(0.5).setDepth(10);
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