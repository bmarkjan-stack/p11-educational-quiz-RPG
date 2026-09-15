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

        // Characters & bosses
        this.load.image("player-male", "assets/images/characters/male/player-male.png");
        this.load.image("player-female", "assets/images/characters/female/player-female.png");
        this.load.image("boss1-slime", "assets/images/characters/enemies/boss1-slime.png");
        this.load.image("final-boss-dragon", "assets/images/characters/enemies/final-boss-dragon.png");

        // Music

        // UI
        this.load.image("button-normal", "assets/images/ui/button-normal.png");
        this.load.image("button-hover", "assets/images/ui/button-hover.png");
        this.load.image("button-active", "assets/images/ui/button-active.png");


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