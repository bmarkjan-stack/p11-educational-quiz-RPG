import Phaser from "phaser";
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
        this.playMusic();
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
    // Lesson Selection
    // --------------------------------------------------

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

            this.showError(
                "Could not load this lesson. Please try again."
            );
        }
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
}