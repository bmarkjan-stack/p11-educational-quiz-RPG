import Phaser from "phaser";
import Button from "../ui/Button.js";

export default class PreloadScene extends Phaser.Scene {
    constructor() {
        super("PreloadScene");

        // Loading screen objects 
        this.loadingLabel = null; 
        this.loadingBox = null; 
        this.loadingBar = null; 
        this.percentageLabel = null; 
        
        // Continue button 
        this.continueButton = null;
    }

    preload() {
        this.createLoadingBar();

        // Backgrounds
        this.load.image("bg-main-menu", "assets/images/background/bg-main-menu.png");
        this.load.image("bg-character-creation", "assets/images/background/bg-character-creation.png");
        this.load.image("bg-lesson-select", "assets/images/background/bg-lesson-select.png");
        this.load.image("bg-classroom", "assets/images/background/bg-classroom.png");
        this.load.image("bg-dungeon", "assets/images/background/bg-dungeon.png");

        // Characters & bosses
        this.load.image("player-male", "assets/images/characters/male/player-male.png");
        this.load.image("player-female", "assets/images/characters/female/player-female.png");
        this.load.image("boss1-slime", "assets/images/characters/enemies/boss1-slime.png");
        this.load.image("final-boss-dragon", "assets/images/characters/enemies/final-boss-dragon.png");

        // Music
        this.load.audio("bgm-menu", encodeURI("assets/audio/Music/Main Menu - Rising Sun - DivKid.mp3"));
        this.load.audio("bgm-lesson", encodeURI("assets/audio/Music/Lesson Learn - Cartoon Bank Heist - Doug Maxwell_Media Right Productions.mp3"));
        this.load.audio("bgm-battle", encodeURI("assets/audio/Music/Boss Fight - Galactic Damages - Jingle Punks.mp3"));
        this.load.audio("bgm-victory", encodeURI( "assets/audio/Music/Victory Sound - Cartoon Bank Heist (Sting) - Doug Maxwell_Media Right Productions.mp3"));
        this.load.audio("bgm-defeat", encodeURI("assets/audio/Music/Defeat Sound - Space Coast - Topher Mohr and Alex Elena.mp3"));

        // SFX
        this.load.audio("sfx-correct", encodeURI("assets/audio/SFX/Correct Sound.wav"));
        this.load.audio("sfx-incorrect", encodeURI("assets/audio/SFX/Incorrect Sound.mp3"));
        this.load.audio("sfx-player-attack", encodeURI("assets/audio/SFX/Sword Slash.wav"));
        this.load.audio("sfx-boss-attack", encodeURI("assets/audio/SFX/Slime attack.mp3"));

        // UI Button States
        this.load.image("button-normal", "assets/images/ui/button-normal.png");
        this.load.image("button-hover", "assets/images/ui/button-hover.png");
        this.load.image("button-active", "assets/images/ui/button-active.png");

        // Character Creation UI
        this.load.image("create-char-panel", "assets/images/ui/create-char-panel.png");
        this.load.image("enter-name", "assets/images/ui/enter-name.png");

        // Character Selection States
        this.load.image("female-normal", "assets/images/ui/female-normal.png");
        this.load.image("female-select", "assets/images/ui/female-select.png");
        this.load.image("female-active", "assets/images/ui/female-active.png");
        this.load.image("male-normal", "assets/images/ui/male-normal.png");
        this.load.image("male-select", "assets/images/ui/male-select.png");
        this.load.image("male-active", "assets/images/ui/male-active.png");

        // Lesson Select UIs
        // Frontend
        this.load.image("frontend-normal", "assets/images/ui/frontend-normal.png");
        this.load.image("frontend-hover", "assets/images/ui/frontend-hover.png");
        this.load.image("frontend-active", "assets/images/ui/frontend-active.png");
        this.load.image("frontend-cloud", "assets/images/ui/frontend-cloud.png");

        // Backend
        this.load.image("backend-normal", "assets/images/ui/backend-normal.png");
        this.load.image("backend-hover", "assets/images/ui/backend-hover.png");
        this.load.image("backend-active", "assets/images/ui/backend-active.png");
        this.load.image("backend-cloud", "assets/images/ui/backend-cloud.png");

        // Responsive Web Design
        this.load.image("responsive-normal", "assets/images/ui/responsive-normal.png");
        this.load.image("responsive-hover", "assets/images/ui/responsive-hover.png");
        this.load.image("responsive-active", "assets/images/ui/responsive-active.png");

        // JavaScript
        this.load.image("javascript-normal", "assets/images/ui/javascript-normal.png");
        this.load.image("javascript-hover", "assets/images/ui/javascript-hover.png");
        this.load.image("javascript-active", "assets/images/ui/javascript-active.png");
        this.load.image("javascript-cloud", "assets/images/ui/javascript-cloud.png");

        // Python
        this.load.image("python-normal", "assets/images/ui/python-normal.png");
        this.load.image("python-hover", "assets/images/ui/python-hover.png");
        this.load.image("python-active", "assets/images/ui/python-active.png");

        // Relational Databases
        this.load.image("relational-database-normal", "assets/images/ui/relational-database-normal.png");
        this.load.image("relational-database-hover", "assets/images/ui/relational-database-hover.png");
        this.load.image("relational-database-active", "assets/images/ui/relational-database-active.png");
        this.load.image("relational-databases-cloud", "assets/images/ui/relational-databases-cloud.png");

        // Full-Stack Exam
        this.load.image("full-stack-normal", "assets/images/ui/full-stack-normal.png");
        this.load.image("full-stack-normal-locked", "assets/images/ui/full-stack-normal-locked.png");
        this.load.image("full-stack-hover", "assets/images/ui/full-stack-hover.png");
        this.load.image("full-stack-active", "assets/images/ui/full-stack-active.png");
        this.load.image("full-stack-cloud", "assets/images/ui/full-stack-cloud.png");

        // Daily Coding Challenges
        this.load.image("daily-normal", "assets/images/ui/daily-normal.png");
        this.load.image("daily-hover", "assets/images/ui/daily-hover.png");
        this.load.image("daily-active", "assets/images/ui/daily-active.png");
        this.load.image("daily-coding-cloud", "assets/images/ui/daily-coding-cloud.png");

        // Loading Progress
        this.load.on("progress", (value) => { 
            this.loadingBar.width = 410 * value; 
            
            this.percentageLabel.setText( 
                `${Math.floor(value * 100)}%` 
            ); 
        });

        // Loading Complete
        this.load.once("complete", () => { 
            this.loadingLabel.setText("Assets Loaded!"); 
            this.percentageLabel.setText("100%"); 
            
            this.time.delayedCall(300, () => { 
                this.loadingLabel.destroy(); 
                this.loadingBox.destroy(); 
                this.loadingBar.destroy(); 
                this.percentageLabel.destroy(); 
                this.createContinueButton(); 
            }); 
        });
    }

    createLoadingBar() {
        const { width, height } = this.scale;

        // Background
        this.add 
            .image(
                width / 2, 
                height / 2, 
                "preload-background"
            ) 
            .setDisplaySize(width, height);

        // Title
        this.add 
            .image(width / 2, 
                height / 2, 
                "game-title"
            ) 
            .setOrigin(0.5);

        // Loading Text
        this.loadingLabel = this.add 
            .text(
                width / 2, 
                height - 145, 
                "Loading...", 
                { 
                    fontFamily: "LearnQuest", 
                    fontSize: "24px", 
                    fontStyle: "bold", 
                    color: "#ffffff", 
                }
            ) 
            .setOrigin(0.5);

        // Progress Bar Background
        this.loadingBox = this.add 
            .rectangle( 
                width / 2, 
                height - 100, 
                420, 
                36, 
                0x111827, 
                0.9 
            ) 
            .setStrokeStyle(2, 0x5f74bd);

        // Progress Bar 
        this.loadingBar = this.add 
            .rectangle( 
                width / 2 - 205, 
                height - 100, 
                10, 
                26, 
                0x5f74bd, 
                1 
            ) 
            .setOrigin(0, 0.5);

        // Loading Percentage
        this.percentageLabel = this.add 
            .text(
                width / 2, 
                height - 55, 
                "0%", 
                { 
                    fontFamily: "LearnQuest", 
                    fontSize: "18px", 
                    color: "#c7d2fe", 
                }
            ) 
            .setOrigin(0.5);
    }

    createContinueButton() {
        const { width, height } = this.scale;

        this.continueButton = new Button(
            this,
            width / 2,
            height - 80,
            "PRESS TO CONTINUE",
            () => {
                const music = this.sound.get("bgm-main"); 
                
                if (!music) { 
                    this.sound.play("bgm-main", { 
                        loop: true, 
                        volume: 0.4, 
                    }); 
                } else if (!music.isPlaying) { 
                    music.play(); 
                }

                this.scene.start("MenuScene");
            },
            {
                width: 300,
                height: 64,
                fontFamily: "LearnQuest",
                fontSize: "20px",
            }
        );

        this.continueButton.setDepth(10);
    }

    create() {
    }
}