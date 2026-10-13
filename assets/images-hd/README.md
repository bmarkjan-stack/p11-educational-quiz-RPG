# High-resolution asset placeholder

The game is designed on a **1280x720** canvas and scaled to fit the screen. In **fullscreen / borderless** on a 1080p, 1440p or 4K display the art is stretched (1.5x / 2x / 3x), so it looks soft. Everything below is currently authored at 1x.

## How to add hi-res art

1. Export each image at **2x** the size listed (use 3x only if you want a 4K-sharp result - 2x is plenty for 1080p/1440p).
2. Save it in this folder (`assets/images-hd/`) with the **same relative path and filename** as the original, e.g. `assets/images/ui/button-normal.png` -> `assets/images-hd/ui/button-normal.png`.
3. Add the path (without the `assets/images/` prefix) to `HI_RES_FILES` in `src/config/hiResAssets.js`.
4. Keep the **exact same aspect ratio** as the original.
5. Hi-res files are only loaded when the screen is 1080p or taller. Until `HI_RES_FILES` has entries nothing changes.

Files drawn with `setDisplaySize()` swap in cleanly. Files drawn with `setScale()` or at natural size (characters, enemies, title) also need a small scale tweak in their scene - send them over and that pass can be done at the same time.

Audio and fonts do not need higher-resolution versions.

## Full-canvas art (backgrounds, quiz options, lesson-map layers, panels) - 1280x720 (76 files)

Drawn with `setDisplaySize(1280, 720)`, so a 2x/3x file swaps in with **no code change**. **Highest priority** - these fill the whole screen and are what looks soft in fullscreen. (Exception: `background/title.png` is drawn with `setScale(0.7)`, so it needs a scene tweak like the sprites below.)

| File | Now (1x) | 2x | 3x |
|---|---|---|---|
| `background/bg-character-creation.png` | 1280x720 | 2560x1440 | 3840x2160 |
| `background/bg-classroom.png` | 1280x720 | 2560x1440 | 3840x2160 |
| `background/bg-lesson-select.png` | 1280x720 | 2560x1440 | 3840x2160 |
| `background/bg-main-menu.png` | 1280x720 | 2560x1440 | 3840x2160 |
| `background/bg-preload.png` | 1280x720 | 2560x1440 | 3840x2160 |
| `background/quiz/bg-backend-development.png` | 1280x720 | 2560x1440 | 3840x2160 |
| `background/quiz/bg-front-end-libraries.png` | 1280x720 | 2560x1440 | 3840x2160 |
| `background/quiz/bg-full-stack.png` | 1280x720 | 2560x1440 | 3840x2160 |
| `background/quiz/bg-javascript.png` | 1280x720 | 2560x1440 | 3840x2160 |
| `background/quiz/bg-python.png` | 1280x720 | 2560x1440 | 3840x2160 |
| `background/quiz/bg-relational-database.png` | 1280x720 | 2560x1440 | 3840x2160 |
| `background/quiz/bg-responsive-web-design.png` | 1280x720 | 2560x1440 | 3840x2160 |
| `background/title.png` | 1280x720 | 2560x1440 | 3840x2160 |
| `quiz/option-a-active.png` | 1280x720 | 2560x1440 | 3840x2160 |
| `quiz/option-a-correct.png` | 1280x720 | 2560x1440 | 3840x2160 |
| `quiz/option-a-hover.png` | 1280x720 | 2560x1440 | 3840x2160 |
| `quiz/option-a-incorrect.png` | 1280x720 | 2560x1440 | 3840x2160 |
| `quiz/option-a-normal.png` | 1280x720 | 2560x1440 | 3840x2160 |
| `quiz/option-b-active.png` | 1280x720 | 2560x1440 | 3840x2160 |
| `quiz/option-b-correct.png` | 1280x720 | 2560x1440 | 3840x2160 |
| `quiz/option-b-hover.png` | 1280x720 | 2560x1440 | 3840x2160 |
| `quiz/option-b-incorrect.png` | 1280x720 | 2560x1440 | 3840x2160 |
| `quiz/option-b-normal.png` | 1280x720 | 2560x1440 | 3840x2160 |
| `quiz/option-c-active.png` | 1280x720 | 2560x1440 | 3840x2160 |
| `quiz/option-c-correct.png` | 1280x720 | 2560x1440 | 3840x2160 |
| `quiz/option-c-hover.png` | 1280x720 | 2560x1440 | 3840x2160 |
| `quiz/option-c-incorrect.png` | 1280x720 | 2560x1440 | 3840x2160 |
| `quiz/option-c-normal.png` | 1280x720 | 2560x1440 | 3840x2160 |
| `quiz/option-d-active.png` | 1280x720 | 2560x1440 | 3840x2160 |
| `quiz/option-d-correct.png` | 1280x720 | 2560x1440 | 3840x2160 |
| `quiz/option-d-hover.png` | 1280x720 | 2560x1440 | 3840x2160 |
| `quiz/option-d-incorrect.png` | 1280x720 | 2560x1440 | 3840x2160 |
| `quiz/option-d-normal.png` | 1280x720 | 2560x1440 | 3840x2160 |
| `quiz/question-panel.png` | 1280x720 | 2560x1440 | 3840x2160 |
| `ui/backend-active.png` | 1280x720 | 2560x1440 | 3840x2160 |
| `ui/backend-cloud.png` | 1280x720 | 2560x1440 | 3840x2160 |
| `ui/backend-done.png` | 1280x720 | 2560x1440 | 3840x2160 |
| `ui/backend-hover.png` | 1280x720 | 2560x1440 | 3840x2160 |
| `ui/backend-normal.png` | 1280x720 | 2560x1440 | 3840x2160 |
| `ui/battle-title.png` | 1280x720 | 2560x1440 | 3840x2160 |
| `ui/frontend-active.png` | 1280x720 | 2560x1440 | 3840x2160 |
| `ui/frontend-cloud.png` | 1280x720 | 2560x1440 | 3840x2160 |
| `ui/frontend-done.png` | 1280x720 | 2560x1440 | 3840x2160 |
| `ui/frontend-hover.png` | 1280x720 | 2560x1440 | 3840x2160 |
| `ui/frontend-normal.png` | 1280x720 | 2560x1440 | 3840x2160 |
| `ui/full-stack-active.png` | 1280x720 | 2560x1440 | 3840x2160 |
| `ui/full-stack-cloud.png` | 1280x720 | 2560x1440 | 3840x2160 |
| `ui/full-stack-done.png` | 1280x720 | 2560x1440 | 3840x2160 |
| `ui/full-stack-hover.png` | 1280x720 | 2560x1440 | 3840x2160 |
| `ui/full-stack-normal-locked.png` | 1280x720 | 2560x1440 | 3840x2160 |
| `ui/full-stack-normal.png` | 1280x720 | 2560x1440 | 3840x2160 |
| `ui/javascript-active.png` | 1280x720 | 2560x1440 | 3840x2160 |
| `ui/javascript-cloud.png` | 1280x720 | 2560x1440 | 3840x2160 |
| `ui/javascript-done.png` | 1280x720 | 2560x1440 | 3840x2160 |
| `ui/javascript-hover.png` | 1280x720 | 2560x1440 | 3840x2160 |
| `ui/javascript-normal.png` | 1280x720 | 2560x1440 | 3840x2160 |
| `ui/lesson-panel-body.png` | 1280x720 | 2560x1440 | 3840x2160 |
| `ui/lesson-panel-title.png` | 1280x720 | 2560x1440 | 3840x2160 |
| `ui/phase-2-active.png` | 1280x720 | 2560x1440 | 3840x2160 |
| `ui/phase-2-cloud.png` | 1280x720 | 2560x1440 | 3840x2160 |
| `ui/phase-2-hover.png` | 1280x720 | 2560x1440 | 3840x2160 |
| `ui/phase-2-normal.png` | 1280x720 | 2560x1440 | 3840x2160 |
| `ui/python-active.png` | 1280x720 | 2560x1440 | 3840x2160 |
| `ui/python-done.png` | 1280x720 | 2560x1440 | 3840x2160 |
| `ui/python-hover.png` | 1280x720 | 2560x1440 | 3840x2160 |
| `ui/python-normal.png` | 1280x720 | 2560x1440 | 3840x2160 |
| `ui/relational-database-active.png` | 1280x720 | 2560x1440 | 3840x2160 |
| `ui/relational-database-done.png` | 1280x720 | 2560x1440 | 3840x2160 |
| `ui/relational-database-hover.png` | 1280x720 | 2560x1440 | 3840x2160 |
| `ui/relational-database-normal.png` | 1280x720 | 2560x1440 | 3840x2160 |
| `ui/relational-databases-cloud.png` | 1280x720 | 2560x1440 | 3840x2160 |
| `ui/responsive-active.png` | 1280x720 | 2560x1440 | 3840x2160 |
| `ui/responsive-done.png` | 1280x720 | 2560x1440 | 3840x2160 |
| `ui/responsive-hover.png` | 1280x720 | 2560x1440 | 3840x2160 |
| `ui/responsive-normal.png` | 1280x720 | 2560x1440 | 3840x2160 |
| `ui/result-panel.png` | 1280x720 | 2560x1440 | 3840x2160 |

## Buttons - 300x70 (3 files)

Drawn with `setDisplaySize()` - drop-in.

| File | Now (1x) | 2x | 3x |
|---|---|---|---|
| `ui/button-active.png` | 300x70 | 600x140 | 900x210 |
| `ui/button-hover.png` | 300x70 | 600x140 | 900x210 |
| `ui/button-normal.png` | 300x70 | 600x140 | 900x210 |

## Character-select portraits - 260x260 (6 files)

Check scale in CharacterSelectScene when swapped.

| File | Now (1x) | 2x | 3x |
|---|---|---|---|
| `ui/female-active.png` | 260x260 | 520x520 | 780x780 |
| `ui/female-normal.png` | 260x260 | 520x520 | 780x780 |
| `ui/female-select.png` | 260x260 | 520x520 | 780x780 |
| `ui/male-active.png` | 260x260 | 520x520 | 780x780 |
| `ui/male-normal.png` | 260x260 | 520x520 | 780x780 |
| `ui/male-select.png` | 260x260 | 520x520 | 780x780 |

## Create-character panel - 620x640 (1 files)

| File | Now (1x) | 2x | 3x |
|---|---|---|---|
| `ui/create-char-panel.png` | 620x640 | 1240x1280 | 1860x1920 |

## Name-entry panel - 530x160 (1 files)

| File | Now (1x) | 2x | 3x |
|---|---|---|---|
| `ui/enter-name.png` | 530x160 | 1060x320 | 1590x480 |

## Player sprites - 256x256 (2 files)

Drawn with `setScale()` - needs a scene tweak when swapped.

| File | Now (1x) | 2x | 3x |
|---|---|---|---|
| `characters/female/player-female.png` | 256x256 | 512x512 | 768x768 |
| `characters/male/player-male.png` | 256x256 | 512x512 | 768x768 |

## Enemy sprites - 384x384 (30 files)

Drawn with `setScale()` - needs a scene tweak when swapped.

| File | Now (1x) | 2x | 3x |
|---|---|---|---|
| `characters/enemies/01-python/1-variable-ghost.png` | 384x384 | 768x768 | 1152x1152 |
| `characters/enemies/01-python/2-control-flow-jester.png` | 384x384 | 768x768 | 1152x1152 |
| `characters/enemies/01-python/3-function-larva.png` | 384x384 | 768x768 | 1152x1152 |
| `characters/enemies/01-python/boss-indentation-imp.png` | 384x384 | 768x768 | 1152x1152 |
| `characters/enemies/01-responsive-web-design/1-mobile-first-mite.png` | 384x384 | 768x768 | 1152x1152 |
| `characters/enemies/01-responsive-web-design/2-breakpoint-beetle.png` | 384x384 | 768x768 | 1152x1152 |
| `characters/enemies/01-responsive-web-design/3-grid-flex-gnat.png` | 384x384 | 768x768 | 1152x1152 |
| `characters/enemies/01-responsive-web-design/boss-layout-gremlin.png` | 384x384 | 768x768 | 1152x1152 |
| `characters/enemies/02-javascript/1-variable-void.png` | 384x384 | 768x768 | 1152x1152 |
| `characters/enemies/02-javascript/2-function-fume.png` | 384x384 | 768x768 | 1152x1152 |
| `characters/enemies/02-javascript/3-array-abomination.png` | 384x384 | 768x768 | 1152x1152 |
| `characters/enemies/02-javascript/boss-null-pointer-ooze.png` | 384x384 | 768x768 | 1152x1152 |
| `characters/enemies/02-relational-databases/1-database-warden.png` | 384x384 | 768x768 | 1152x1152 |
| `characters/enemies/02-relational-databases/2-predicate-sentry.png` | 384x384 | 768x768 | 1152x1152 |
| `characters/enemies/02-relational-databases/3-relational-aggregate-twins.png` | 384x384 | 768x768 | 1152x1152 |
| `characters/enemies/02-relational-databases/boss-foreign-key-fiend.png` | 384x384 | 768x768 | 1152x1152 |
| `characters/enemies/03-backend-and-apis/1-request-imp-response-pixie.png` | 384x384 | 768x768 | 1152x1152 |
| `characters/enemies/03-backend-and-apis/2-REST-resource-mimic.png` | 384x384 | 768x768 | 1152x1152 |
| `characters/enemies/03-backend-and-apis/3-status-code-golem.png` | 384x384 | 768x768 | 1152x1152 |
| `characters/enemies/03-backend-and-apis/boss-the-api-archon.png` | 384x384 | 768x768 | 1152x1152 |
| `characters/enemies/03-frontend-libraries/1-component-wyrmling.png` | 384x384 | 768x768 | 1152x1152 |
| `characters/enemies/03-frontend-libraries/2-data-flow-wyrmling.png` | 384x384 | 768x768 | 1152x1152 |
| `characters/enemies/03-frontend-libraries/3-hook-fiend-wyrmling.png` | 384x384 | 768x768 | 1152x1152 |
| `characters/enemies/03-frontend-libraries/boss-framework-wyrm.png` | 384x384 | 768x768 | 1152x1152 |
| `characters/enemies/05-second-phase/01 Grimgrid, Lord of Broken Layouts.png` | 384x384 | 768x768 | 1152x1152 |
| `characters/enemies/05-second-phase/01 Indentrix, the Misaligned.png` | 384x384 | 768x768 | 1152x1152 |
| `characters/enemies/05-second-phase/02 Keybane, Devourer of Broken Relations.png` | 384x384 | 768x768 | 1152x1152 |
| `characters/enemies/05-second-phase/02 Nullmire, the Pointer Eater.png` | 384x384 | 768x768 | 1152x1152 |
| `characters/enemies/05-second-phase/03 Apoocalypt, Lord of the Backends.png` | 384x384 | 768x768 | 1152x1152 |
| `characters/enemies/05-second-phase/03 Wyrmframe, the Library Devourer.png` | 384x384 | 768x768 | 1152x1152 |

## Dragon bosses (wider) - 484x384 (2 files)

Drawn with `setScale()` - needs a scene tweak when swapped.

| File | Now (1x) | 2x | 3x |
|---|---|---|---|
| `characters/enemies/04-full-stack/04-cyberpunk-dragon-overlord.png` | 484x384 | 968x768 | 1452x1152 |
| `characters/enemies/05-second-phase/04 Draconis Prime, Cyberpunk Full-Stack Dragon Overlord.png` | 484x384 | 968x768 | 1452x1152 |
