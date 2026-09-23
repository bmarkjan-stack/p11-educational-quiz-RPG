import Phaser from "phaser";
import Button from "../ui/Button.js";

export default class CharacterSelectScene extends Phaser.Scene {
    constructor() {
        super("CharacterSelectScene");

        // Name input 
        this.nameInputActive = false; 
        this.cursorVisible = true; 
        this.cursorText = null; 
        this.cursorBlinkEvent = null; 
        this.keydownHandler = null;
    }

    create() {
        this.selectedCharacter = null;
        this.characterName = "";
        this.characterCards = {};

        this.drawBackground();
        this.createTitle();
        this.createCharacterPanel();
        this.createCharacterOptions();
        this.createNameInput();
        this.createButtons();
        this.bindKeyboard();

        this.events.once("shutdown", () => {
            this.cleanupKeyboard()
            this.cleanupCursor();
        });
    }

    // Background
    drawBackground() {
        this.add
            .image(640, 360, "bg-character-creation")
            .setDisplaySize(1280, 720);
    }

    // Title
    createTitle() {
        this.add
            .text(640, 85, "", {
                fontFamily: "Arial",
                fontSize: "36px",
                fontStyle: "bold",
                color: "#ffffff",
            })
            .setOrigin(0.5);

        this.add
            .text(640, 130, "Select your character to begin.", {
                fontFamily: "Arial",
                fontSize: "20px",
                color: "#c7d2fe",
            })
            .setOrigin(0.5);
    }

    // Character Panel
    createCharacterPanel() { 
        this.add 
            .image(640, 350, "create-char-panel") 
            .setDepth(1); 
    }

    // Character Options
    createCharacterOptions() {
        this.createCharacterCard(485, "male", "MALE", "HP 20  \u2022  DMG 6");
        this.createCharacterCard(795, "female", "FEMALE", "HP 15  \u2022  DMG 8");
    }

    createCharacterCard(x, id, title, description) {
        const normalKey = `${id}-normal`; 
        const selectKey = `${id}-select`; 
        const activeKey = `${id}-active`;

        // Portrait
        const sprite = this.add 
            .image(x, 255, normalKey) 
            .setDisplaySize(260, 260) 
            .setDepth(2);

        // Invisible clickable area
        const hitArea = this.add 
            .rectangle(x, 255, 260, 260, 0xffffff, 0) 
            .setInteractive({ 
                useHandCursor: true 
            }) 
            .setDepth(3); 

        // Character Title
        const titleText = this.add 
            .text(x, 395, title, { 
                fontFamily: "LearnQuest", 
                fontSize: "22px", 
                fontStyle: "bold", 
                color: "#ffffff", 
            }) 
            .setOrigin(0.5) 
            .setDepth(4); 
        
        // Character Description
        const descriptionText = this.add 
            .text(x, 420, description, { 
                fontFamily: "LearnQuest", 
                fontSize: "13px", 
                color: "#ffbf75", 
            }) 
            .setOrigin(0.5) 
            .setDepth(4); 
        
        // Hover
        hitArea.on("pointerover", () => { 
            if (this.selectedCharacter !== id) { 
                sprite.setTexture(selectKey); 
            } 
        }); 
        
        hitArea.on("pointerout", () => { 
            if (this.selectedCharacter !== id) { 
                sprite.setTexture(normalKey); 
            } 
        }); 
        
        // Selection
        hitArea.on("pointerdown", () => { 
            this.selectCharacter(id); 
        }); 
        
        this.characterCards[id] = { 
            hitArea, 
            sprite, 
            titleText, 
            descriptionText, 
            normalKey, 
            selectKey,
            activeKey, 
        }; 
    }

    // Character Selection
    selectCharacter(id) {
        this.selectedCharacter = id;

        Object.entries(this.characterCards).forEach(
            ([characterId, character]) => {
                const isSelected = characterId === id;

                character.sprite.setTexture( 
                    isSelected 
                        ? character.activeKey 
                        : character.normalKey 
                ); 

                character.titleText.setColor( 
                    isSelected 
                        ? "#ffffff" 
                        : "#c7d2fe"
                );
            }
        );
    }

    // Name Input
    createNameInput() {
        this.nameBox = this.add
            .image(640, 505, "enter-name")
            .setDisplaySize(530, 160)
            .setDepth(2)
            .setInteractive({ 
                useHandCursor: true 
            });

        this.nameText = this.add
            .text(640, 525, "Enter your name...", {
                fontFamily: "LearnQuest",
                fontSize: "26px",
                color: "#94a3b8",
            })
            .setOrigin(0.5)
            .setDepth(3);

        // Click name box
        this.nameBox.on("pointerdown", () => { 
            this.nameInputActive = true; 

            if (!this.characterName) { 
                this.nameText.setText(""); 
            } 
            
            this.nameText.setColor("#ffffff"); 
            this.cursorVisible = true; this.updateNameCursor(); 
            this.startCursorBlink(); 
        });
    }

    // Keyboard Input
    bindKeyboard() {
        this.keydownHandler = (event) => { 
            // Ignore keyboard input if the scene is no longer active.
            if (!this.scene.isActive()) { 
                return; 
            } 

            // Only accept keyboard input when the name box is active.
            if (!this.nameInputActive) { 
                return; 
            }

            // Backspace
            if (event.key === "Backspace") { 
                this.characterName = 
                    this.characterName.slice(0, -1); 
            } 

            // Letters, numbers, and space
            else if ( 
                event.key.length === 1 && 
                this.characterName.length < 14 && 
                /[a-zA-Z0-9 ]/.test(event.key) 
            ) { 
                this.characterName += event.key; 
            } 
            
            // Ignore everything else
            else { 
                return; 
            } 

            // Always use white text while typing 
            this.nameText.setColor("#ffffff"); 

            // Display the character name 
            this.nameText.setText(this.characterName);

            // Keep cursor visible
            this.cursorVisible = true; 
            this.updateNameCursor();
        }; 

        this.input.keyboard.on( 
            "keydown", 
            this.keydownHandler 
        );
    }

    // Update Cursor Position 
    updateNameCursor() { 
        if (!this.nameInputActive) { 
            return; 
        } 
        
        // Create cursor if it doesn't exist 
        if (!this.cursorText) { 
            this.cursorText = this.add 
            .text(0, 0, "|", { 
                fontFamily: "LearnQuest", 
                fontSize: "28px", 
                color: "#ffffff", 
            }) 
            .setOrigin(0, 0.5) 
            .setDepth(4); 
        } 
        
        // Position cursor immediately after the name 
        const textWidth = this.nameText.width; 
        
        this.cursorText.setPosition( 
            this.nameText.x + (textWidth / 2) + 4, 
            this.nameText.y 
        ); 

        this.cursorText.setVisible( 
            this.cursorVisible 
        ); 
    } 

    // Start Cursor Blinking 
    startCursorBlink() { 
        // Prevent multiple timers 
        if (this.cursorBlinkEvent) { 
            this.cursorBlinkEvent.remove(); 
        } 
        
        this.cursorBlinkEvent = this.time.addEvent({ 
            delay: 500, 
            loop: true, 

            callback: () => { 
                if (!this.nameInputActive) { 
                    return; 
                } 
                
                this.cursorVisible = !this.cursorVisible; 
                this.updateNameCursor(); 
            } 
        }); 
    } 
    
    // Clean Up Cursor 
    cleanupCursor() { 
        if (this.cursorBlinkEvent) { 
            this.cursorBlinkEvent.remove(); 
            this.cursorBlinkEvent = null; 
        } 
        
        if (this.cursorText) { 
            this.cursorText.destroy(); 
            this.cursorText = null; 
        } 
    }

    // Clean Up Keyboard 
    cleanupKeyboard() {
        if (this.keydownHandler) {
            this.input.keyboard.off(
                "keydown", 
                this.keydownHandler
            );

            this.keydownHandler = null;
        }
    }

    // Buttons
    createButtons() {
        const backButton = new Button(
            this, 500, 620, "BACK",() => {
                this.scene.start("MenuScene");
            },
            { 
                width: 180 
            }
        );

        const confirmButton = new Button(
            this, 780, 620, "CONFIRM", () => {
                this.confirmCharacter()
            }, 
            { 
                width: 180 
            }
        );
        
        backButton.setDepth(5); 
        confirmButton.setDepth(5);
    }

    // Confirm Character
    confirmCharacter() {
        if (!this.selectedCharacter) {
            this.showMessage(
                "Character Required", 
                "Please select a character first."
            );

            return;
        }

        if (!this.characterName.trim()) {
            this.showMessage(
                "Name Required",
                "Please enter a name before continuing."
            );

            return;
        }

        this.scene.start("LessonSelectScene", {
            character: this.selectedCharacter,
            characterName: this.characterName.trim(),
        });
    }

    // Message
    showMessage(title, message) {
        const overlay = this.add
            .rectangle(640, 360, 700, 300, 0x070b18, 0.97)
            .setStrokeStyle(2, 0x5f74bd)
            .setDepth(10);

        const titleText = this.add
            .text(640, 285, title, {
                fontFamily: "Arial",
                fontSize: "30px",
                fontStyle: "bold",
                color: "#ffffff",
            })
            .setOrigin(0.5)
            .setDepth(11);

        const messageText = this.add
            .text(640, 350, message, {
                fontFamily: "Arial",
                fontSize: "18px",
                color: "#c7d2fe",
                align: "center",
                wordWrap: { 
                    width: 550 
                },
            })
            .setOrigin(0.5)
            .setDepth(11);

        const closeButton = new Button(
            this, 640, 430, "OK", () => {
                overlay.destroy();
                titleText.destroy();
                messageText.destroy();
                closeButton.destroy();
            },
            { 
                width: 160 
            }
        );

        closeButton.setDepth(11);
    }
}