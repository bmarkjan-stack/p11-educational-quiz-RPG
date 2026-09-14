import Button from "./Button.js";

const CHOICE_LABELS = ["A", "B", "C", "D"];

export default class QuestionPanel {
    constructor(scene, x, y, width = 900) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.width = width;
        this.buttons = [];
        this.locked = false;

        this.questionText = scene.add
            .text(x, y, "", {
                fontFamily: "Arial",
                fontSize: "24px",
                fontStyle: "bold",
                color: "#ffffff",
                align: "center",
                wordWrap: { width },
            })
            .setOrigin(0.5);

        this.feedbackText = scene.add
            .text(x, y + 190, "", {
                fontFamily: "Arial",
                fontSize: "20px",
                fontStyle: "bold",
                color: "#ffffff",
            })
            .setOrigin(0.5);
    }

    showQuestion(questionData, onAnswer) {
        this.clearButtons();
        this.feedbackText.setText("");

        this.questionText.setText(questionData.question);
        this.onAnswer = onAnswer;
        this.correctIndex = questionData.answer;

        const columns = 2;
        const gapX = 320;
        const gapY = 70;
        const startX = this.x - gapX / 2;
        const startY = this.y + 70;

        questionData.choices.forEach((choiceText, index) => {
            const col = index % columns;
            const row = Math.floor(index / columns);

            const buttonX = startX + col * gapX;
            const buttonY = startY + row * gapY;

            const button = new Button(
                this.scene,
                buttonX,
                buttonY,
                `${CHOICE_LABELS[index]}. ${choiceText}`,
                () => this.handleAnswer(index),
                { width: 300, height: 56, fontSize: "16px" }
            );

            this.buttons.push(button);
        });
    }

    handleAnswer(selectedIndex) {
        if (this.locked) return;
        this.locked = true;

        const isCorrect = selectedIndex === this.correctIndex;

        this.buttons.forEach((button, index) => {
            button.setEnabled(false);

            if (index === this.correctIndex) {
                button.background.setFillStyle(0x16a34a, 1);
            } else if (index === selectedIndex) {
                button.background.setFillStyle(0xdc2626, 1);
            }
        });

        this.feedbackText.setText(isCorrect ? "Correct!" : "Incorrect!");
        this.feedbackText.setColor(isCorrect ? "#4ade80" : "#f87171");

        if (this.onAnswer) {
            this.onAnswer(isCorrect, selectedIndex);
        }
    }

    disable() {
        this.buttons.forEach((button) => button.setEnabled(false));
    }

    clearButtons() {
        this.buttons.forEach((button) => button.destroy());
        this.buttons = [];
        this.locked = false;
    }

    destroy() {
        this.clearButtons();
        this.questionText.destroy();
        this.feedbackText.destroy();
    }
}
