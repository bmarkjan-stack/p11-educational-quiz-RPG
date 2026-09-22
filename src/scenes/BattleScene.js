import Phaser from "phaser";
import Player from "../entities/Player.js";
import Boss from "../entities/Boss.js";
import HealthBar from "../ui/HealthBar.js";
import QuestionPanel from "../ui/QuestionPanel.js";
import Button from "../ui/Button.js";
import QuizManager from "../systems/QuizManager.js";
import ProgressManager from "../systems/ProgressManager.js";

const ENEMY_ROSTERS = {
    "responsive-web-design": [
        { textureKey: "rwd-mobile-first-mite", name: "Mobile-First Mite", maxHp: 42, attackPower: 5 },
        { textureKey: "rwd-breakpoint-beetle", name: "Breakpoint Beetle", maxHp: 42, attackPower: 6 },
        { textureKey: "rwd-grid-flex-gnat", name: "Grid-Flex Gnat", maxHp: 42, attackPower: 7 },
    ],
    javascript: [
        { textureKey: "javascript-variable-void", name: "Variable Void", maxHp: 42, attackPower: 5 },
        { textureKey: "javascript-function-fume", name: "Function Fume", maxHp: 42, attackPower: 6 },
        { textureKey: "javascript-array-abomination", name: "Array Abomination", maxHp: 42, attackPower: 7 },
    ],
    python: [
        { textureKey: "python-variable-ghost", name: "Variable Ghost", maxHp: 42, attackPower: 5 },
        { textureKey: "python-control-flow-jester", name: "Control Flow Jester", maxHp: 42, attackPower: 6 },
        { textureKey: "python-function-larva", name: "Function Larva", maxHp: 42, attackPower: 7 },
    ],
    "relational-databases": [
        { textureKey: "database-warden", name: "Database Warden", maxHp: 42, attackPower: 5 },
        { textureKey: "predicate-sentry", name: "Predicate Sentry", maxHp: 42, attackPower: 6 },
        { textureKey: "relational-aggregate-twins", name: "Relational Aggregate Twins", maxHp: 42, attackPower: 8 },
    ],
    "backend-apis": [
        { textureKey: "request-response-pixie", name: "Request/Response Pixie", maxHp: 42, attackPower: 6 },
        { textureKey: "rest-resource-mimic", name: "REST Resource Mimic", maxHp: 42, attackPower: 7 },
        { textureKey: "status-code-golem", name: "Status Code Golem", maxHp: 42, attackPower: 8 },
    ],
    "frontend-libraries": [
        { textureKey: "component-wyrmling", name: "Component Wyrmling", maxHp: 42, attackPower: 6 },
        { textureKey: "data-flow-wyrmling", name: "Data Flow Wyrmling", maxHp: 42, attackPower: 7 },
        { textureKey: "hook-fiend-wyrmling", name: "Hook Fiend Wyrmling", maxHp: 42, attackPower: 9 },
    ],
};

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
        this.playMusic();

        this.nextQuestion();
    }

    drawBackground() {
        this.add.image(640, 360, "bg-dungeon").setDisplaySize(1280, 720);
    }

    createCombatants(section) {
        this.player = new Player(this, 260, 300, this.character, this.characterName);

        const lessonRoster = ENEMY_ROSTERS[this.lesson.id] ?? ENEMY_ROSTERS["responsive-web-design"];
        const bossConfig = lessonRoster[this.sectionIndex] ?? lessonRoster[0];

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

    playMusic() {
        this.sound.stopAll();
        this.sound.play("bgm-battle", { loop: true, volume: 0.35 });
    }

    nextQuestion() {
        if (this.quizManager.isComplete()) {
            if (this.boss.isAlive()) {
                this.showBattleIncomplete();
            }
            return;
        }

        const question = this.quizManager.getCurrentQuestion();
        this.questionPanel.showQuestion(question, (isCorrect, selectedIndex) =>
            this.resolveTurn(isCorrect, selectedIndex)
        );
    }

    resolveTurn(isCorrect, selectedIndex) {
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
                this.boss.playDefeatAnimation(() => this.endBattle());
                return;
            }

            if (!this.player.isAlive()) {
                this.showDefeat();
                return;
            }

            this.quizManager.next({ repeatCurrent: !isCorrect });
            this.time.delayedCall(300, () => this.nextQuestion());
        });
    }

    endBattle() {
        if (this.boss.isAlive()) {
            this.showBattleIncomplete();
            return;
        }

        const results = this.quizManager.getResults();
        const cumulativeScore = this.priorBattleScore + results.correct;
        const cumulativeTotal = this.priorBattleTotal + results.total;

        this.progressManager.recordBattleResult(this.lesson.id, cumulativeScore);
        this.sound.stopAll();

        this.showVictory(() => this.continueAfterVictory(cumulativeScore, cumulativeTotal));
    }

    continueAfterVictory(cumulativeScore, cumulativeTotal) {
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

    showVictory(onContinue) {
        const overlay = this.add
            .rectangle(640, 360, 760, 360, 0x07130d, 0.97)
            .setStrokeStyle(2, 0x22c55e)
            .setDepth(10);

        this.add
            .text(640, 265, "VICTORY!", {
                fontFamily: "Arial",
                fontSize: "34px",
                fontStyle: "bold",
                color: "#86efac",
            })
            .setOrigin(0.5)
            .setDepth(11);

        this.add
            .text(640, 315, `${this.boss.name} has been defeated!`, {
                fontFamily: "Arial",
                fontSize: "22px",
                color: "#ffffff",
                align: "center",
                wordWrap: { width: 650 },
            })
            .setOrigin(0.5)
            .setDepth(11);

        const continueButton = new Button(
            this,
            640,
            390,
            "CONTINUE",
            onContinue,
            { width: 280 }
        );

        const exitButton = new Button(
            this,
            640,
            465,
            "EXIT TO LESSON SELECT",
            () => {
                this.scene.start("LessonSelectScene", {
                    character: this.character,
                    characterName: this.characterName,
                });
            },
            { width: 300 }
        );

        [continueButton, exitButton].forEach((button) => {
            button.normalImage.setDepth(11);
            button.hoverImage.setDepth(11);
            button.activeImage.setDepth(11);
            button.background.setDepth(12);
            button.label.setDepth(12);
        });
    }

    showBattleIncomplete() {
        this.sound.stopAll();
        this.sound.play("bgm-defeat", { volume: 0.5 });

        this.add
            .rectangle(640, 360, 700, 260, 0x070b18, 0.97)
            .setStrokeStyle(2, 0xdc2626)
            .setDepth(10);

        this.add
            .text(640, 300, "BATTLE INCOMPLETE", {
                fontFamily: "Arial",
                fontSize: "30px",
                fontStyle: "bold",
                color: "#facc15",
            })
            .setOrigin(0.5)
            .setDepth(11);

        this.add
            .text(640, 345, "Defeat the enemy to continue.", {
                fontFamily: "Arial",
                fontSize: "18px",
                color: "#e2e8f0",
            })
            .setOrigin(0.5)
            .setDepth(11);

        const retryButton = new Button(
            this,
            640,
            410,
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
