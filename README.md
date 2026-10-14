# LearnQuest — Educational Quiz RPG

LearnQuest is a fantasy RPG for learning web development and databases. Players read a lesson, then answer quiz questions to defeat the monsters that guard each section. Each lesson ends with a boss fight, and a capstone exam at the end ties the whole course together.

It runs in the browser and as a desktop app, and it is built with **Phaser 3**, **Vite**, and modern JavaScript.

![LearnQuest live demo](live-demo/LearnQuest-live-demo.gif)

---

## Table of Contents

- [How to Play](#how-to-play)
- [Curriculum](#curriculum)
- [Game Systems](#game-systems)
- [Characters, Enemies, and Bosses](#characters-enemies-and-bosses)
- [Getting Started](#getting-started)
- [Desktop App (Electron)](#desktop-app-electron)
- [Saves](#saves)
- [Settings](#settings)
- [Adding Lesson Content](#adding-lesson-content)
- [Testing](#testing)
- [Project Structure](#project-structure)
- [Technical Highlights](#technical-highlights)
- [Credits](#credits)
- [License](#license)

---

## How to Play

1. **Pick a character.** Choose a male or female hero and enter a name.
2. **Choose a lesson.** Lessons are grouped into two tracks, Frontend and Backend. A lesson unlocks when its prerequisites are complete.
3. **Read the lesson.** Each lesson has several sections of reading pages, with code examples where they help.
4. **Fight a section battle.** At the end of each section, a monster appears. Answer its quiz questions correctly to hit it. Wrong answers let it hit back.
5. **Face the lesson boss.** Once every section is cleared, a boss appears for the lesson's exam. Each correct answer damages it, and each wrong answer damages you.
6. **Level up.** Correct answers and victories earn XP. Each level increases your max HP and damage.
7. **Finish the course.** Complete the Frontend and Backend tracks to unlock the **Full-Stack Capstone Exam**, which ends with a final boss fight in several phases.

---

## Curriculum

| Track | Lesson | Sections | Reading pages | Exam questions |
| --- | --- | --- | --- | --- |
| Frontend | Responsive Web Design | 3 | 15 | 20 |
| Frontend | JavaScript Fundamentals | 3 | 9 | 20 |
| Frontend | Frontend Development Libraries | 3 | 11 | 20 |
| Backend | Python Fundamentals | 3 | 11 | 20 |
| Backend | Relational Databases | 3 | 11 | 20 |
| Backend | Backend Development & APIs | 3 | 9 | 20 |
| Capstone | Full-Stack Capstone Exam | 6 | 30 | 51 |

The curriculum is defined in `src/systems/curriculum.js`. The capstone requires both the Frontend Libraries and Backend & APIs lessons. Those lessons depend on the rest of their tracks, so completing the capstone means completing every lesson.

---

## Game Systems

### Section battles

Each section has its own short quiz. Every question is answered with one choice from a list, under a timer.

- A **correct** answer damages the enemy by your attack power.
- A **wrong** answer, or a timeout, lets the enemy hit you.

Enemies are sized so that a fight takes about the same number of correct answers each time. For a normal monster, you defeat it in 3 hits and it defeats you in 2 hits at base stats. Your stats grow as you level up, so the balance scales with your progress.

### Lesson boss exams

The lesson boss is a multi-question exam. The boss takes damage from correct answers, and it hits you for each wrong answer. The lesson's exam is a fixed set of 20 questions.

### Full-Stack Capstone Exam

The capstone has 51 questions. Its boss, **The Full-Stack Overlord**, fights in several phases.

### Progression

- XP needed for the next level is `30 × current level`.
- Each level adds **2 max HP** and **1 damage**.
- Section battles award a fixed XP reward. Boss exams award more.
- Progress is saved at checkpoints during lessons, battles, and exams, so you can resume where you left off.

### Quiz randomization

Questions in a quiz are shuffled each time the battle starts. The quiz engine (`QuizManager`) keeps track of correct and incorrect answers, and it reports accuracy at the end of each battle.

---

## Characters, Enemies, and Bosses

- **Player:** a male or female hero, with stats that grow with level.
- **Section enemies:** each lesson has three monsters with names that match the lesson topic. The Responsive Web Design monsters include the Mobile-First Mite, Breakpoint Beetle, and Grid-Flex Gnat. The Python monsters include the Variable Ghost and Control Flow Jester.
- **Lesson bosses:** one boss per lesson, such as the Indentation Imp for Python and the Foreign Key Fiend for Relational Databases.
- **Final boss:** The Full-Stack Overlord, with a multi-phase fight.

Enemy sprites and boss art are in `assets/images/characters/enemies/`.

---

## Getting Started

**Requirements:** Node.js (current LTS) and npm.

```bash
git clone https://github.com/bmarkjan-stack/p11-educational-quiz-rpg.git
cd p11-educational-quiz-rpg
npm install
npm run dev
```

Open the local URL that Vite prints.

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Starts the browser dev server |
| `npm run build` | Builds the game into `dist/` |
| `npm run preview` | Serves the production build locally |

In the browser, progress is stored in the browser's `localStorage`.

---

## Desktop App (Electron)

Electron is already listed in `package.json`, so `npm install` is all you need.

| Command | What it does |
| --- | --- |
| `npm run desktop:dev` | Starts the Vite dev server and opens the game in an Electron window with hot reload |
| `npm run desktop:start` | Builds the game, then runs it in Electron |
| `npm run desktop:pack` | Builds an unpacked desktop app with electron-builder |
| `npm run desktop:dist` | Builds installers and portable apps into `release/` |

The packaged app is configured for Windows (portable and zip), Linux (AppImage and tar.gz), and macOS (zip). Packaging is done in `package.json` under `build`.

---

## Saves

Progress and settings are stored as JSON files in a `saves/` folder next to the game:

- `progress.json`: characters, lesson checkpoints, XP, and stats
- `settings.json`: music volume, sound-effect volume, and display mode

Each file is written with a `.bak` copy of the previous version. If the game can't write to the folder, for example when it is installed in Program Files, it uses the per-user app-data folder. The active save location is shown at the bottom of the Settings panel.

To start over, delete the `saves/` folder.

---

## Settings

- **Music** and **Sound Effects** sliders, applied live and saved when you release the slider
- **Display** options:
  - **Windowed**
  - **Borderless Windowed** (desktop app only, since browsers can't create borderless windows)
  - **Fullscreen**

Changing to or from Borderless reopens the window, because Electron can't change a window's frame in place. The game returns to the Settings panel afterwards.

---

## Adding Lesson Content

Lessons are plain JSON files in `public/data/lessons/`, so you can add or change content without touching game code.

Each lesson file has:

- `id`, `title`, and `description`
- `sections`: each section has `id`, `title`, `pages`, and `quiz`
- `exam`: the lesson boss's questions

Each page has `content`, optional `code` lines, and optional `examples`. Each question has its choices and the index of the correct answer.

Content is validated when it loads. A lesson must have at least one exam question, and every section must have its own quiz. Invalid content throws an error that names the lesson, and the section or question where the problem is.

To add a new lesson, create its JSON file and add an entry in `src/systems/curriculum.js`. The entry sets its track, its order, and the lessons it requires.

---

## Testing

Tests use Node's built-in test runner:

```bash
node --test tests/
```

The suite covers the progression rules: XP thresholds, level rewards, and the enemy hit-count rules that scale with player stats.

---

## Project Structure

```text
p11-educational-quiz-rpg/
├── assets/
│   ├── audio/            # background music and sound effects
│   ├── fonts/            # Cinzel Decorative, IM Fell English, MedievalSharp, Pixelify Sans
│   ├── images/           # backgrounds, characters, enemies, quiz and UI art
│   └── images-hd/        # placeholder for higher-resolution art (see its README)
├── electron/
│   ├── main.cjs          # desktop window, saves, display modes, quit confirmation
│   └── preload.cjs
├── public/
│   └── data/lessons/     # lesson content as JSON
├── scripts/
│   └── dev-electron.mjs  # runs Vite and Electron together for desktop:dev
├── src/
│   ├── config/           # high-resolution asset list
│   ├── entities/         # Player and Boss
│   ├── scenes/           # one file per screen, including battle and exam scenes
│   ├── systems/          # curriculum, lessons, quizzes, progress, settings, audio, and quit flow
│   ├── ui/               # buttons, bars, dropdowns, sliders, and the question panel
│   ├── main.js           # Phaser game configuration and scene list
│   └── styles.css
├── tests/
│   └── progression.test.js
├── index.html
├── package.json
└── vite.config.js
```

---

## Technical Highlights

- **Scene-based architecture.** Each screen is a Phaser `Scene` with its own `init(data)`, `create()`, and cleanup. Data is passed between scenes as an object, so no scene depends on another's internals.
- **Data-driven content.** Quiz questions and lessons are JSON, validated at load time.
- **Separate systems.** Curriculum, lesson loading, quizzes, progress, and settings each live in their own module.
- **Reusable UI.** Buttons, health bars, dropdowns, sliders, and the question panel are shared by several scenes.
- **Entity classes.** `Player` and `Boss` hold their own stats and damage rules.
- **Responsive canvas.** The game is designed at 1280×720 and scaled with Phaser's `FIT` mode, so it fills the window while keeping its proportions.
- **Desktop shell.** The Electron wrapper adds saves in the file system with backups, display modes, and a quit confirmation shared by the in-game button, the window's close button, and keyboard shortcuts.
- **Automated tests.** Progression rules are tested with Node's built-in test runner.

---

## Credits

- Game engine: [Phaser 3](https://phaser.io/) (open source, no paid license required)
- Build tools: [Vite](https://vite.dev/) and [Electron](https://www.electronjs.org/)
- Fonts: Cinzel Decorative, IM Fell English, MedievalSharp, and Pixelify Sans, included in `assets/fonts/` with their license files
- Music: Jingle Punks, Topher Mohr and Alex Elena, Doug Maxwell / Media Right Productions, and DivKid (see the file names in `assets/audio/Music/`)

---

## License

This project is licensed under the [MIT License](LICENSE). You are free to use, copy, modify, merge, publish, distribute, and sell the code, provided the copyright and license notice are included in copies or substantial portions of it.

---

## Author

Created by [bmarkjan-stack](https://github.com/bmarkjan-stack) as a portfolio project.