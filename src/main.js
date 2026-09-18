import Phaser from "phaser";

import BootScene from "./scenes/BootScene.js";
import PreloadScene from "./scenes/PreloadScene.js";
import MenuScene from "./scenes/MenuScene.js";
import CharacterSelectScene from "./scenes/CharacterSelectScene.js";
import LessonSelectScene from "./scenes/LessonSelectScene.js";
import LessonScene from "./scenes/LessonScene.js";
import BattleScene from "./scenes/BattleScene.js";
import ExamScene from "./scenes/ExamScene.js";
import ResultsScene from "./scenes/ResultsScene.js";

const config = {
    type: Phaser.AUTO,
    parent: "game-container",
    width: 1280,
    height: 720,
    backgroundColor: "#0b1020",
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 1280,
        height: 720,
    },

    input: {
        activePointers: 3,
    },

    scene: [
        BootScene,
        PreloadScene,
        MenuScene,
        CharacterSelectScene,
        LessonSelectScene,
        LessonScene,
        BattleScene,
        ExamScene,
        ResultsScene,
    ]
};

new Phaser.Game(config);