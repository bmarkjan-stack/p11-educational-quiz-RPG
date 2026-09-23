import Phaser from "phaser";
import Button from "../ui/Button.js";
import LessonManager from "../systems/LessonManager.js";
import ProgressManager from "../systems/ProgressManager.js";
import { TRACKS, CAPSTONE_LESSON } from "../systems/curriculum.js";

const CENTER_X = 640;
const CENTER_Y = 360;

const DEPTH_NODE = 1;
const DEPTH_CLOUD = 100; // clouds always render above everything else

/*
 * Every PNG is authored for a 1280x720 canvas, so each one is simply
 * centered on the canvas. No per-node positions are needed.
 *
 * Hitboxes are in canvas coordinates: x/y = top-left, plus width/height.
 * cloud: null means the node can never be locked (first in its track).
 */
const NODES = {
    // ---------------- Frontend track ----------------
    "responsive-web-design": {
        normal: "responsive-normal",
        hover: "responsive-hover",
        active: "responsive-active",
        cloud: null,
        hitbox: { x: 60, y: 310, width: 160, height: 90 },
    },
    javascript: {
        normal: "javascript-normal",
        hover: "javascript-hover",
        active: "javascript-active",
        cloud: "javascript-cloud",
        hitbox: { x: 240, y: 310, width: 160, height: 90 },
    },
    "frontend-libraries": {
        normal: "frontend-normal",
        hover: "frontend-hover",
        active: "frontend-active",
        cloud: "frontend-cloud",
        hitbox: { x: 420, y: 300, width: 140, height: 90 },
    },

    // ---------------- Backend track ----------------
    python: {
        normal: "python-normal",
        hover: "python-hover",
        active: "python-active",
        cloud: null,
        hitbox: { x: 1080, y: 310, width: 150, height: 90 },
    },
    "relational-databases": {
        normal: "relational-database-normal",
        hover: "relational-database-hover",
        active: "relational-database-active",
        cloud: "relational-databases-cloud",
        hitbox: { x: 910, y: 310, width: 150, height: 90 },
    },
    "backend-apis": {
        normal: "backend-normal",
        hover: "backend-hover",
        active: "backend-active",
        cloud: "backend-cloud",
        hitbox: { x: 720, y: 300, width: 160, height: 90 },
    },
};

const CAPSTONE = {
    normal: "full-stack-normal",
    locked: "full-stack-normal-locked",
    hover: "full-stack-hover",
    active: "full-stack-active",
    cloud: "full-stack-cloud",
    hitbox: { x: 560, y: 410, width: 160, height: 130 },
};

const DAILY = {
    normal: "daily-normal",
    hover: "daily-hover",
    active: "daily-active",
    cloud: "daily-coding-cloud",
    hitbox: { x: 540, y: 90, width: 200, height: 110 },
};

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

        this.progressManager.setCharacter(
            this.character,
            this.characterName
        );

        this.drawBackground();
        this.createLessonNodes();
        this.createCapstoneNode();
        this.createDailyChallengeNode();
        this.createLastPlayedIndicator();
        this.playMusic();
        this.createBackButton();
    }

    // --------------------------------------------------
    // Background
    // --------------------------------------------------

    drawBackground() {
        this.add
            .image(CENTER_X, CENTER_Y, "bg-lesson-select")
            .setDisplaySize(1280, 720)
            .setDepth(0);
    }

    // --------------------------------------------------
    // Music
    // --------------------------------------------------

    playMusic() {
        this.sound.stopAll();

        this.sound.play("bgm-lesson", {
            loop: true,
            volume: 0.35,
        });
    }

    // --------------------------------------------------
    // Helpers
    // --------------------------------------------------

    /** Adds a full-canvas PNG centered on the 1280x720 canvas. */
    addCentered(key, depth) {
        return this.add
            .image(CENTER_X, CENTER_Y, key)
            .setOrigin(0.5)
            .setDepth(depth);
    }

    /** Cloud overlay: always on top, signals "locked". */
    addCloud(key) {
        if (!key) return null;
        return this.addCentered(key, DEPTH_CLOUD);
    }

    /**
     * A lesson is unlocked when:
     *  - it is the first lesson in its track (responsive web design / python), or
     *  - the previous lesson in the same track is completed, or
     *  - ProgressManager already reports it as unlocked.
     */
    isLessonUnlocked(track, index) {
        const lessonId = track.lessons[index];

        if (this.progressManager.getLessonStatus(lessonId)?.unlocked) {
            return true;
        }

        if (index === 0) return true;

        const previousId = track.lessons[index - 1];
        return !!this.progressManager.getLessonStatus(previousId)?.completed;
    }

    // --------------------------------------------------
    // Lesson Nodes
    // --------------------------------------------------

    createLessonNodes() {
        TRACKS.forEach((track) => {
            track.lessons.forEach((lessonId, index) => {
                this.createLessonNode(
                    lessonId,
                    this.isLessonUnlocked(track, index)
                );
            });
        });
    }

    createLessonNode(lessonId, unlocked) {
        const config = NODES[lessonId];

        if (!config) {
            console.warn(`Missing node config for lesson: ${lessonId}`);
            return;
        }

        const completed =
            !!this.progressManager.getLessonStatus(lessonId)?.completed;

        const node = this.addCentered(
            completed ? config.active : config.normal,
            DEPTH_NODE
        );

        if (!unlocked) {
            // Cloud on top = locked. No interaction.
            this.addCloud(config.cloud);
            return;
        }

        // Unlocked: no cloud is created at all.
        this.enableCustomHitbox(
            node,
            config.hitbox,
            {
                normal: config.normal,
                hover: config.hover,
                active: config.active,
                completed,
            },
            () => this.selectLesson(lessonId)
        );
    }


    enableCustomHitbox(node, hitbox, textures, onSelect) {
        /*
         * Phaser hit areas are expressed in the GameObject's local
         * space, measured from the top-left of its texture.
         *
         * Convert the canvas-coordinate rectangle by subtracting
         * the node's top-left corner.
         */
        const topLeft = node.getTopLeft();

        const hitArea = new Phaser.Geom.Rectangle(
            hitbox.x - topLeft.x,
            hitbox.y - topLeft.y,
            hitbox.width,
            hitbox.height
        );

        node.setInteractive(
            hitArea,
            Phaser.Geom.Rectangle.Contains,
            {
                useHandCursor: true,
            }
        );

        const restingTexture = textures.completed
            ? textures.active
            : textures.normal;

        const hoverTexture = textures.completed
            ? textures.active
            : textures.hover;

        const activeTexture = textures.active;

        // ---------------------------------------------
        // Pointer enters button
        // ---------------------------------------------

        node.on("pointerover", () => {
            // Don't override the active state while mouse is held.
            if (!node.isPointerDown) {
                node.setTexture(hoverTexture);
            }
        });

        // ---------------------------------------------
        // Pointer leaves button
        // ---------------------------------------------

        node.on("pointerout", () => {
            // If the mouse is being held, keep active state.
            if (!node.isPointerDown) {
                node.setTexture(restingTexture);
            }
        });

        // ---------------------------------------------
        // Mouse button pressed
        // ---------------------------------------------

        node.on("pointerdown", () => {
            node.isPointerDown = true;

            // Show active texture immediately.
            node.setTexture(activeTexture);
        });

        // ---------------------------------------------
        // Mouse button released
        // ---------------------------------------------

        node.on("pointerup", (pointer) => {
            node.isPointerDown = false;

            /*
             * Keep the active texture visible briefly after release.
             * This gives the button a clear pressed animation/state
             * before the scene changes.
             */
            node.setTexture(activeTexture);

            this.time.delayedCall(120, () => {
                // Make sure the node still exists.
                if (!node.active) return;

                // Return to hover state if the mouse is still over it.
                if (node.getBounds().contains(pointer.x, pointer.y)) {
                    node.setTexture(hoverTexture);
                } else {
                    node.setTexture(restingTexture);
                }

                // Change scene only AFTER the active state has ended.
                onSelect();
            });
        });

        // ---------------------------------------------
        // Mouse released outside the button
        // ---------------------------------------------

        node.on("pointerupoutside", () => {
            node.isPointerDown = false;
            node.setTexture(restingTexture);
        });
    }

    // --------------------------------------------------
    // Full-Stack Capstone
    // --------------------------------------------------

    createCapstoneNode() {
        const status =
            this.progressManager.getLessonStatus(CAPSTONE_LESSON);

        const unlocked = !!status?.unlocked;
        const completed = !!status?.completed;

        const node = this.addCentered(
            completed
                ? CAPSTONE.active
                : unlocked
                ? CAPSTONE.normal
                : CAPSTONE.locked,
            DEPTH_NODE
        );

        if (!unlocked) {
            this.addCloud(CAPSTONE.cloud);
            return;
        }

        this.enableCustomHitbox(
            node,
            CAPSTONE.hitbox,
            {
                normal: CAPSTONE.normal,
                hover: CAPSTONE.hover,
                active: CAPSTONE.active,
                completed,
            },
            () => this.selectLesson(CAPSTONE_LESSON)
        );
    }

    // --------------------------------------------------
    // Daily Coding Challenges
    // --------------------------------------------------

    createDailyChallengeNode() {
        const unlocked =
            this.progressManager.isDailyChallengeUnlocked();

        this.dailyChallengeStats =
            this.progressManager.getDailyChallengeStats();

        const node = this.addCentered(DAILY.normal, DEPTH_NODE);

        if (!unlocked) {
            this.addCloud(DAILY.cloud);
            return;
        }

        this.enableCustomHitbox(
            node,
            DAILY.hitbox,
            {
                normal: DAILY.normal,
                hover: DAILY.hover,
                active: DAILY.normal,
                completed: false,
            },
            () =>
                this.scene.start("DailyChallengesScene", {
                    character: this.character,
                    characterName: this.characterName,
                })
        );
    }

    // --------------------------------------------------
    // "Last Played" Indicator
    // --------------------------------------------------

    createLastPlayedIndicator() {
        const lastId = this.progressManager.getLastVisitedLesson();
        if (!lastId) return;

        const hitbox = lastId === CAPSTONE_LESSON ? CAPSTONE.hitbox : NODES[lastId]?.hitbox;
        if (!hitbox) return;

        const markerX = hitbox.x + hitbox.width - 6;
        const markerY = hitbox.y + 6;

        const badge = this.add
            .circle(markerX, markerY, 13, 0xfacc15, 1)
            .setStrokeStyle(2, 0x1a0f05)
            .setDepth(DEPTH_CLOUD + 1);

        const glyph = this.add
            .text(markerX, markerY, "\u25B6", {
                fontFamily: "Arial",
                fontSize: "14px",
                fontStyle: "bold",
                color: "#1a0f05",
            })
            .setOrigin(0.5)
            .setDepth(DEPTH_CLOUD + 2);

        const label = this.add
            .text(markerX, markerY - 28, "LAST PLAYED", {
                fontFamily: "Arial",
                fontSize: "12px",
                fontStyle: "bold",
                color: "#facc15",
                stroke: "#1a0f05",
                strokeThickness: 3,
            })
            .setOrigin(0.5)
            .setDepth(DEPTH_CLOUD + 2);

        this.tweens.add({
            targets: [badge, glyph],
            scale: { from: 1, to: 1.18 },
            duration: 650,
            yoyo: true,
            repeat: -1,
        });
    }

    // --------------------------------------------------
    // Lesson Selection
    // --------------------------------------------------

    selectLesson(lessonId) {
        // Remember this as the lesson the player last engaged with,
        // regardless of how they leave (requirement #2).
        this.progressManager.setLastVisitedLesson(lessonId);

        if (this.progressManager.isCompleted(lessonId)) {
            // requirement #6: warn that replaying won't grant XP.
            this.showReplayConfirm(lessonId);
            return;
        }

        this.beginLesson(lessonId, { awardsExperience: true });
    }

    async beginLesson(lessonId, { awardsExperience }) {
        try {
            const lesson = await this.lessonManager.loadLesson(lessonId);

            // requirement #3: resume where the player left off, if anywhere.
            const checkpoint = awardsExperience
                ? this.progressManager.getLessonCheckpoint(lessonId)
                : null;

            const basePayload = {
                lesson,
                character: this.character,
                characterName: this.characterName,
                awardsExperience,
            };

            if (checkpoint?.stage === "exam") {
                this.scene.start("ExamScene", {
                    ...basePayload,
                    battleScore: checkpoint.battleScore ?? 0,
                    battleTotal: checkpoint.battleTotal ?? 0,
                });
                return;
            }

            this.scene.start("LessonScene", {
                ...basePayload,
                sectionIndex: checkpoint?.sectionIndex ?? 0,
                battleScore: checkpoint?.battleScore ?? 0,
                battleTotal: checkpoint?.battleTotal ?? 0,
            });
        } catch (error) {
            console.error(error);

            this.showError(
                "Could not load this lesson. Please try again."
            );
        }
    }

    // --------------------------------------------------
    // Replay Confirmation
    // --------------------------------------------------

    showReplayConfirm(lessonId) {
        const overlay = this.add
            .rectangle(640, 360, 760, 300, 0x070b18, 0.97)
            .setStrokeStyle(2, 0xfacc15)
            .setDepth(20);

        const title = this.add
            .text(640, 260, "LESSON ALREADY COMPLETED", {
                fontFamily: "Arial",
                fontSize: "24px",
                fontStyle: "bold",
                color: "#facc15",
            })
            .setOrigin(0.5)
            .setDepth(21);

        const message = this.add
            .text(
                640,
                315,
                "You will no longer gain experience for completing this lesson again.\nWould you still like to continue?",
                {
                    fontFamily: "Arial",
                    fontSize: "16px",
                    color: "#e2e8f0",
                    align: "center",
                    wordWrap: { width: 660 },
                    lineSpacing: 6,
                }
            )
            .setOrigin(0.5)
            .setDepth(21);

        const cleanup = () => {
            overlay.destroy();
            title.destroy();
            message.destroy();
            yesButton.destroy();
            noButton.destroy();
        };

        const yesButton = new Button(
            this,
            500,
            410,
            "YES, CONTINUE",
            () => {
                cleanup();
                this.beginLesson(lessonId, { awardsExperience: false });
            },
            { width: 260 }
        );

        const noButton = new Button(
            this,
            780,
            410,
            "CANCEL",
            () => {
                cleanup();
            },
            { width: 220 }
        );

        [yesButton, noButton].forEach((button) => {
            button.normalImage.setDepth(21);
            button.hoverImage.setDepth(21);
            button.activeImage.setDepth(21);
            button.background.setDepth(22);
            button.label.setDepth(22);
        });
    }

    // --------------------------------------------------
    // Error Message
    // --------------------------------------------------

    showError(message) {
        const text = this.add
            .text(640, 706, message, {
                fontFamily: "Arial",
                fontSize: "15px",
                color: "#f87171",
            })
            .setOrigin(0.5)
            .setDepth(200);

        this.time.delayedCall(2500, () => text.destroy());
    }

    createBackButton() {
        new Button(
            this,
            1200,
            695,
            "BACK",
            () => {
                this.scene.start("MenuScene");
            },
            { width: 130, height: 40, fontSize: "16px" }
        );
    }
}