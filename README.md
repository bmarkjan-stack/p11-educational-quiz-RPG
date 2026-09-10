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
- LocalStorage persistence
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