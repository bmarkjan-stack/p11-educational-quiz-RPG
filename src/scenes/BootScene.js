import Phaser from "phaser";

export default class BootScene extends Phaser.Scene {
    constructor() {
        super("BootScene");
    }

    preload() {
        // Preload background
        this.load.image( "preload-background", "assets/images/background/bg-preload.png" );
        // Preload title
        this.load.image("game-title", "assets/images/background/title.png");
        // Music
        this.load.audio("bgm-main", encodeURI("assets/audio/Music/Main Menu - Rising Sun - DivKid.mp3")
        );
    }

    create() {
        if (!this.sound.get("bgm-main")) { 
            this.sound.play("bgm-main", { 
                loop: true, 
                volume: 0.4, 
            }); 
        } 
        
        this.scene.start("PreloadScene");
    }
}
