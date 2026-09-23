import Phaser from "phaser";
import Button from "../ui/Button.js";
import ProgressManager from "../systems/ProgressManager.js";

export default class MenuScene extends Phaser.Scene {
    constructor() {
        super("MenuScene");
    }

    create() {
        this.drawBackground();
        this.createTitle();
        this.createButtons();
    }

    drawBackground() {
        this.add.image(640, 360, "bg-main-menu").setDisplaySize(1280, 720);
    }

    createTitle() {
        this.add
            .image(640, 270, "game-title")
            .setOrigin(0.5)
            .setScale(0.7);
    }

    createButtons() {
        const progressManager = new ProgressManager();
        const savedCharacter = progressManager.getCharacter();
        const hasCharacter = Boolean(
            savedCharacter.character && savedCharacter.characterName?.trim()
        );

        // New Game
        this.newGameButton = new Button(this, 640, 410, "NEW GAME", () => {
            this.scene.start("CharacterSelectScene");
        });
        this.newGameButton.setEnabled(!hasCharacter);

        // Continue
        this.continueButton = new Button(this, 640, 470, "CONTINUE", () => {
            this.scene.start("LessonSelectScene", {
                character: savedCharacter.character,
                characterName: savedCharacter.characterName,
            });
        });
        this.continueButton.setEnabled(hasCharacter);

        new Button(this, 640, 530, "SETTINGS", () => {
            this.showSettings();
        });

        new Button(this, 640, 590, "ABOUT", () => {
            this.showAbout();
        });

        new Button(this, 640, 650, "QUIT", () => {
            this.showQuit();
        });
    }

    showSettings() { 
        const overlay = this.add 
            .rectangle(640, 360, 700, 320, 0x070b18, 0.97) 
            .setStrokeStyle(2, 0x5f74bd) 
            .setDepth(10); 
            
        const title = this.add 
            .text(640, 250, "SETTINGS", { 
                fontFamily: "LearnQuest", 
                fontSize: "30px", 
                fontStyle: 
                "bold", 
                color: "#ffffff", 
            }) 
            .setOrigin(0.5) 
            .setDepth(11); 
        
        const progressManager = new ProgressManager(); 

        const resetButton = new Button( 
            this, 640, 350, "RESET PROGRESS", () => { 
                const confirmed = window.confirm( 
                    "Are you sure you want to reset all progress?\n\nThis cannot be undone." 
                ); 
                
                if (!confirmed) { 
                    return; 
                } 
                
                progressManager.resetProgress(); 
                
                overlay.destroy(); 
                title.destroy(); 
                resetButton.destroy(); 
                closeButton.destroy(); 
                
                // Recreate the menu so CONTINUE becomes disabled 
                this.scene.restart(); 
            }, 
            { width: 260 } 
        ); 
        
        resetButton.setDepth(11); 
        
        const closeButton = new Button(
            this, 640, 440, "CLOSE", () => { 
                overlay.destroy(); 
                title.destroy(); 
                resetButton.destroy(); 
                closeButton.destroy(); 
            }
        ); 
        
        closeButton.setDepth(11); 
    }

    showAbout() {
        const overlay = this.add
            .rectangle(640, 360, 700, 260, 0x070b18, 0.97)
            .setStrokeStyle(2, 0x5f74bd)
            .setDepth(10);

        const text = this.add
            .text(
                640,
                340,
                "LearnQuest is an educational quiz RPG.\nAnswer questions correctly to defeat bosses\nand master JavaScript, Python, and SQL!",
                {
                    fontFamily: "LearnQuest",
                    fontSize: "18px",
                    color: "#e2e8f0",
                    align: "center",
                }
            )
            .setOrigin(0.5)
            .setDepth(11);

        const closeButton = new Button(this, 640, 445, "CLOSE", () => {
            overlay.destroy();
            text.destroy();
            closeButton.destroy();
        });

        closeButton.setDepth(11);
    }

    showQuit() {
        const overlay = this.add
            .rectangle(640, 360, 700, 260, 0x070b18, 0.97)
            .setStrokeStyle(2, 0x5f74bd)
            .setDepth(10);

        const text = this.add
            .text(
                640,
                340,
                "This is a browser game!\nJust close the browser tab to quit\n\nHope you enjoyed!",
                {
                    fontFamily: "LearnQuest",
                    fontSize: "18px",
                    color: "#e2e8f0",
                    align: "center",
                }
            )
            .setOrigin(0.5)
            .setDepth(11);

        const closeButton = new Button(this, 640, 445, "CLOSE", () => {
            overlay.destroy();
            text.destroy();
            closeButton.destroy();
        });

        closeButton.setDepth(11);
    }
}
