import Phaser from "phaser";
import Button from "../ui/Button.js";
import ProgressManager from "../systems/ProgressManager.js";
import { CAPSTONE_LESSON } from "../systems/curriculum.js";
import { applyFloatyText } from "../ui/sceneEffects.js";

// ---------------------------------------------------------------
// Inline rich-text layout settings (prose + code in one paragraph)
// ---------------------------------------------------------------
const CONTENT_X = 190;
const CONTENT_Y = 300;
const CONTENT_WIDTH = 500;
const LINE_HEIGHT = 34;

const PROSE_STYLE = {
    fontFamily: "IM Fell English",
    fontSize: "21px",
    color: "#f5ead7",
    shadow: {
        offsetX: 1,
        offsetY: 1,
        color: "#000000",
        blur: 2,
        stroke: true,
        fill: true,
    },
};

const CODE_STYLE = {
    fontFamily: "Pixelify Sans",
    fontSize: "20px",
    color: "#7dd3fc",
};

// Characters that count as part of a "word" when checking that a
// code token is not matched inside a longer word (e.g. "em" in "rem").
const isWordChar = (c) => /[A-Za-z0-9_-]/.test(c);
const isAlnum = (c) => /[A-Za-z0-9_]/.test(c);

/**
 * Splits `content` into [{ text, code }] segments.
 * Each entry of `code` is matched, in order, at its next whole-word
 * occurrence, so a word like "for" is only highlighted where the
 * lesson author listed it.
 */
function splitByCode(content, code = []) {
    const segments = [];
    let cursor = 0;

    for (const token of code) {
        if (!token) continue;

        let index = cursor;
        while (true) {
            index = content.indexOf(token, index);
            if (index < 0) break;

            const before = index > 0 ? content[index - 1] : "";
            const after = content[index + token.length] ?? "";
            const badStart = isAlnum(token[0]) && before && isWordChar(before);
            const badEnd =
                isAlnum(token[token.length - 1]) && after && isWordChar(after);

            if (badStart || badEnd) {
                index += 1;
                continue;
            }
            break;
        }

        if (index < 0) {
            console.warn(`LessonScene: code token "${token}" not found in content.`);
            continue;
        }

        if (index > cursor) {
            segments.push({ text: content.slice(cursor, index), code: false });
        }
        segments.push({ text: token, code: true });
        cursor = index + token.length;
    }

    if (cursor < content.length) {
        segments.push({ text: content.slice(cursor), code: false });
    }

    return segments;
}

export default class LessonScene extends Phaser.Scene {
    constructor() {
        super("LessonScene");
    }

    init(data) {
        this.lesson = data.lesson;
        this.character = data.character;
        this.characterName = data.characterName;
        this.sectionIndex = data.sectionIndex ?? 0;
        this.pageIndex = 0;
        this.awardsExperience = data.awardsExperience ?? true;

        // Cumulative correct/total across every section battle
        // fought so far in this lesson attempt.
        this.battleScore = data.battleScore ?? 0;
        this.battleTotal = data.battleTotal ?? 0;
        this.examCorrect = data.examCorrect ?? 0;
        this.examTotal = data.examTotal ?? 0;
    }

    create() {
        applyFloatyText(this);
        this.progressManager = new ProgressManager();
        this.saveCheckpoint();

        this.drawBackground();
        this.createLessonPanel();
        this.createHeader();
        this.createContentArea();
        this.createContinueButton();
        this.renderSection();
        this.createBackButton();
    }

    saveCheckpoint() {
        if (!this.awardsExperience) return;

        this.progressManager.saveLessonCheckpoint(this.lesson.id, {
            stage: "lesson",
            sectionIndex: this.sectionIndex,
            battleScore: this.battleScore,
            battleTotal: this.battleTotal,
            examCorrect: this.examCorrect,
            examTotal: this.examTotal,
        });
    }

    drawBackground() {
        this.add
            .image(640, 360, "bg-classroom")
            .setDisplaySize(1280, 720);
    }

    createLessonPanel() {
        this.add
            .image(640, 360, "lesson-panel-body")
            .setOrigin(0.5);

        this.add
            .image(640, 360, "lesson-panel-title")
            .setOrigin(0.5);
    }

    createHeader() {
        this.add
            .text(640, 95, this.lesson.title, {
                fontFamily: "Cinzel Decorative",
                fontSize: "28px",
                fontStyle: "bold",
                color: "#ffffff",
                stroke: "#1a0f05",
                strokeThickness: 4,
                shadow: {
                    offsetX: 2,
                    offsetY: 2,
                    color: "#000000",
                    blur: 4,
                    stroke: true,
                    fill: true,
                },
            })
            .setOrigin(0.5);

        this.progressLabel = this.add
            .text(640, 143, "", {
                fontFamily: "MedievalSharp",
                fontSize: "18px",
                color: "#f5e6c8",
                stroke: "#1a0f05",
                strokeThickness: 2,
            })
            .setOrigin(0.5);
    }

    createContentArea() {
        this.sectionTitle = this.add.text(240, 215, "", {
            fontFamily: "Cinzel Decorative",
            fontSize: "25px",
            fontStyle: "bold",
            color: "#facc15",
            stroke: "#1a0f05",
            strokeThickness: 3,
        });

        // Holds the per-word Text objects of the lesson paragraph
        // (prose in IM Fell English, code in Pixelify Sans).
        this.contentContainer = this.add.container(CONTENT_X, CONTENT_Y);

        this.exampleText = this.add.text(800, 235, "", {
            fontFamily: "Pixelify Sans",
            fontSize: "17px",
            color: "#93c5fd",
            wordWrap: {
                width: 300,
            },
            lineSpacing: 5,
        });

        this.pageLabel = this.add.text(640, 570, "", {
            fontFamily: "MedievalSharp",
            fontSize: "16px",
            color: "#f5e6c8",
            stroke: "#1a0f05",
            strokeThickness: 2,
        }).setOrigin(0.5);
    }

    createContinueButton() {
        this.continueButton = new Button(
            this,
            810,
            650,
            "",
            () => this.advanceLessonPage(),
            {
                width: 300,
            }
        );

        this.previousPageButton = new Button(
            this,
            470,
            650,
            "PREVIOUS",
            () => this.showLessonPage(this.pageIndex - 1),
            { width: 300 }
        );
    }

    renderSection() {
        const sections = this.lesson.sections;
        const section = sections[this.sectionIndex];

        if (!section) {
            console.warn(
                `LessonScene: Section ${this.sectionIndex} does not exist.`
            );
            return;
        }

        this.progressLabel.setText(
            `Section ${this.sectionIndex + 1} / ${sections.length}`
        );

        this.sectionTitle.setText(section.title);
        this.pages = Array.isArray(section.pages) && section.pages.length > 0
            ? section.pages
            : [section];
        this.pageIndex = 0;
        this.renderLessonPage();
    }

    renderLessonPage() {
        const page = this.pages[this.pageIndex];
        this.renderRichText(page.content ?? "", page.code ?? []);

        const examples = page.examples ?? [];

        this.exampleText.setText(
            examples.length
                ? examples.join("\n")
                : ""
        );

        this.exampleText.setVisible(examples.length > 0);
        this.pageLabel.setText(`Page ${this.pageIndex + 1} / ${this.pages.length}`);
        this.previousPageButton.setEnabled(this.pageIndex > 0);

        this.continueButton.setText(
            this.pageIndex < this.pages.length - 1
                ? "NEXT PAGE"
                : this.lesson.id === CAPSTONE_LESSON
                    ? "START SECTION EXAM"
                    : "START SECTION QUIZ"
        );
    }

    /**
     * Draws a wrapped paragraph where words listed in `code` use the
     * code font and everything else uses the prose font.
     * Phaser Text objects can't mix fonts, so each word is its own
     * Text object, laid out manually inside this.contentContainer.
     */
    renderRichText(content, code) {
        this.contentContainer.removeAll(true);

        const atoms = this.buildAtoms(splitByCode(content, code));
        const spaceWidth = this.measureSpaceWidth();

        let x = 0;
        let line = 0;

        for (const atom of atoms) {
            const style = atom.code ? CODE_STYLE : PROSE_STYLE;

            // make.text(..., false) creates the Text without adding it to
            // the scene display list; the container owns it instead.
            const word = this.make.text(
                { x: 0, y: 0, text: atom.text, style },
                false
            );

            const gap = atom.space && x > 0 ? spaceWidth : 0;

            if (x > 0 && x + gap + word.width > CONTENT_WIDTH) {
                x = 0;
                line += 1;
            } else {
                x += gap;
            }

            // Bottom-left origin keeps mixed fonts on a shared line.
            word.setOrigin(0, 1);
            word.setPosition(x, (line + 1) * LINE_HEIGHT);

            x += word.width;
            this.contentContainer.add(word);
        }
    }

    // Turns segments into word atoms. `space` is true when whitespace
    // came before the word, so punctuation like "," stays glued to code.
    buildAtoms(segments) {
        const atoms = [];
        let pendingSpace = false;

        for (const segment of segments) {
            for (const part of segment.text.split(/(\s+)/)) {
                if (part === "") continue;

                if (/^\s+$/.test(part)) {
                    pendingSpace = true;
                    continue;
                }

                atoms.push({
                    text: part,
                    code: segment.code,
                    space: pendingSpace,
                });
                pendingSpace = false;
            }
        }

        return atoms;
    }

    measureSpaceWidth() {
        if (this.spaceWidth) return this.spaceWidth;

        const a = this.make.text({ x: 0, y: 0, text: "i i", style: PROSE_STYLE }, false);
        const b = this.make.text({ x: 0, y: 0, text: "ii", style: PROSE_STYLE }, false);
        this.spaceWidth = Math.max(4, Math.round(a.width - b.width));
        a.destroy();
        b.destroy();

        return this.spaceWidth;
    }

    showLessonPage(pageIndex) {
        if (pageIndex < 0 || pageIndex >= this.pages.length) return;

        this.pageIndex = pageIndex;
        this.renderLessonPage();
    }

    advanceLessonPage() {
        if (this.pageIndex < this.pages.length - 1) {
            this.showLessonPage(this.pageIndex + 1);
            return;
        }

        this.startSectionBattle();
    }

    startSectionBattle() {
        const sceneKey = this.lesson.id === CAPSTONE_LESSON
            ? "ExamScene"
            : "BattleScene";

        this.scene.start(sceneKey, {
            lesson: this.lesson,
            character: this.character,
            characterName: this.characterName,
            sectionIndex: this.sectionIndex,
            battleScore: this.battleScore,
            battleTotal: this.battleTotal,
            awardsExperience: this.awardsExperience,
            examSectionIndex: this.sectionIndex,
            examCorrect: this.examCorrect,
            examTotal: this.examTotal,
        });
    }

    createBackButton() {
        new Button(
            this,
            110,
            35,
            "Return to World Map",
            () => {
                this.scene.start("LessonSelectScene");
            },
            { width: 180, height: 40, fontSize: "14px" }
        );
    }
}