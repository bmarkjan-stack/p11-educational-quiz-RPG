# LearnQuest — Educational Quiz RPG

LearnQuest is a **data-driven educational RPG built with Phaser 3 and Vite**.

The player:

1. Chooses a course.
2. Reads lesson content.
3. Challenges a knowledge boss.
4. Answers quiz questions to deal damage.
5. Unlocks the next lesson after victory.
6. Takes a special final exam when every lesson is complete.
7. Defeats the final boss to complete the course.

## Key portfolio concepts demonstrated

- Phaser Scene architecture
- Data-driven game design
- JSON content instead of hard-coded quiz logic
- Reusable UI components
- Entity classes for Player and Boss
- Separate systems for lessons, quizzes, and progress
- File-based save data (JSON in a `saves/` folder next to the game)
- Scene-to-scene state via Phaser Registry
- Responsive canvas scaling
- Modular ES6 JavaScript
- Extensible course/lesson structure

## Project structure

```text
learnquest/
├── assets/
│   ├── images/
│   ├── audio/
│   └── fonts/
│
├── public/
│   └── data/
│       └── lessons/
│           ├── javascript.json
│           ├── python.json
│           └── sql.json
│
├── src/
│   ├── main.js
│   ├── styles.css
│   │
│   ├── scenes/
│   │   ├── BootScene.js
│   │   ├── PreloadScene.js
│   │   ├── MenuScene.js
│   │   ├── LessonSelectScene.js
│   │   ├── LessonScene.js
│   │   ├── BattleScene.js
│   │   ├── ExamScene.js
│   │   └── ResultsScene.js
│   │
│   ├── entities/
│   │   ├── Player.js
│   │   └── Boss.js
│   │
│   ├── systems/
│   │   ├── QuizManager.js
│   │   ├── LessonManager.js
│   │   └── ProgressManager.js
│   │
│   └── ui/
│       ├── Button.js
│       ├── HealthBar.js
│       └── QuestionPanel.js
│
├── index.html
├── package.json
└── README.md
```

> The original architecture can keep `data/lessons` at the repository root, but Vite serves runtime-static files most simply from `public/`. That is why this implementation uses `public/data/lessons`.

## No paid Phaser account required

Phaser itself is an open-source HTML5 game framework. You can develop locally in VS Code and host a built web game on a static hosting service. This project does not require a Phaser subscription.

## Desktop app (Electron)

One-time setup (adds Electron and the packager to `package.json`):

```bash
npm install
npm install --save-dev electron electron-builder
```

| Command | What it does |
|---|---|
| `npm run dev` | Browser dev server (saves fall back to localStorage, no borderless option) |
| `npm run desktop:dev` | Vite + Electron window with hot reload |
| `npm run desktop:start` | Build, then run the real desktop app |
| `npm run desktop:dist` | Build installers/portable apps into `release/` |

### Saves
Progress and settings are JSON files in a `saves/` folder next to the game (`progress.json`, `settings.json`, each with a `.bak` of the previous write). If that folder is read-only (e.g. installed in Program Files) the game falls back to the per-user app-data folder; the active path is shown at the bottom of the Settings panel. Delete the `saves/` folder to start fresh.

### Settings
Music and sound-effect sliders (applied live, saved on release) and a display drop-down: Windowed, Borderless Windowed, Fullscreen. Switching to or from Borderless reopens the window (Electron can't change a window's frame in place) and returns to the Settings panel.

### Quit
The QUIT button, the window X button, Alt+F4 and Cmd+Q all show the same "Are you sure?" prompt. During the initial asset load a native dialog is used instead.

### Higher-resolution art
See `assets/images-hd/README.md` and `src/config/hiResAssets.js`.
