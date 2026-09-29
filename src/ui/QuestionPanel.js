import Button from "./Button.js";

const CHOICE_LABELS = ["A", "B", "C", "D"];
const OPTION_KEYS = ["a", "b", "c", "d"];
const QUESTION_AREA = { x: 30, y: 470, width: 610, height: 230 };
const OPTION_AREAS = [
    { x: 650, y: 470, width: 295, height: 110 },
    { x: 960, y: 470, width: 295, height: 110 },
    { x: 650, y: 590, width: 295, height: 110 },
    { x: 960, y: 590, width: 295, height: 110 },
];

export default class QuestionPanel {
    constructor(scene) {
        this.scene = scene;
        this.buttons = [];
        this.locked = false;
        this.timerEvent = null;
        this.remainingSeconds = 20;

        this.panelImage = scene.add
            .image(640, 360, "quiz-question-panel")
            .setDepth(1);

        this.questionText = scene.add
            .text(
                QUESTION_AREA.x + QUESTION_AREA.width / 2,
                QUESTION_AREA.y + 115,
                "",
                {
                fontFamily: "LearnQuest",
                fontSize: "24px",
                fontStyle: "bold",
                color: "#ffffff",
                align: "center",
                padding: { left: 5, right: 5, top: 5, bottom: 5 },
                wordWrap: { width: QUESTION_AREA.width - 10 },
                }
            )
            .setOrigin(0.5)
            .setDepth(4);

        this.feedbackText = scene.add
            .text(QUESTION_AREA.x + QUESTION_AREA.width / 2, 682, "", {
                fontFamily: "LearnQuest",
                fontSize: "20px",
                fontStyle: "bold",
                color: "#ffffff",
            })
            .setOrigin(0.5)
            .setDepth(4);

        this.timerText = scene.add
            .text(QUESTION_AREA.x + QUESTION_AREA.width / 2, 485, "", {
                fontFamily: "LearnQuest",
                fontSize: "18px",
                fontStyle: "bold",
                color: "#ffffff",
            })
            .setOrigin(0.5)
            .setDepth(4);
    }

    showQuestion(questionData, onAnswer) {
        this.stopTimer();
        this.clearButtons();
        this.feedbackText.setText("");

        this.questionText.setText(questionData.question);
        this.onAnswer = onAnswer;
        this.correctIndex = questionData.answer;

        questionData.choices.forEach((choiceText, index) => {
            const area = OPTION_AREAS[index];
            const buttonX = area.x + area.width / 2;
            const buttonY = area.y + area.height / 2;
            const optionKey = OPTION_KEYS[index];

            const button = new Button(
                this.scene,
                buttonX,
                buttonY,
                `${CHOICE_LABELS[index]}. ${choiceText}`,
                () => this.handleAnswer(index),
                {
                    width: area.width,
                    height: area.height,
                    fontSize: "16px",
                    normalTexture: `quiz-option-${optionKey}-normal`,
                    hoverTexture: `quiz-option-${optionKey}-hover`,
                    activeTexture: `quiz-option-${optionKey}-active`,
                    fullCanvasImages: true,
                }
            );
            button.label
                .setWordWrapWidth(area.width - 10)
                .setPadding(5, 5, 5, 5);
            button.setDepth(1);

            this.buttons.push(button);
        });

        this.remainingSeconds = 20;
        this.timerText.setText(`Time: ${this.remainingSeconds}s`).setColor("#ffffff");
        this.timerEvent = this.scene.time.addEvent({
            delay: 1000,
            repeat: this.remainingSeconds - 1,
            callback: () => {
                this.remainingSeconds -= 1;
                this.timerText.setText(`Time: ${this.remainingSeconds}s`);
                if (this.remainingSeconds <= 5) this.timerText.setColor("#f87171");
                if (this.remainingSeconds === 0) this.handleTimeout();
            },
        });
        if (this.scene.exitConfirmation) this.timerEvent.paused = true;
    }

    handleAnswer(selectedIndex) {
        if (this.locked) return;
        this.locked = true;
        this.stopTimer();

        const isCorrect = selectedIndex === this.correctIndex;

        this.buttons.forEach((button, index) => {
            button.setEnabled(false);

            if (index === this.correctIndex) {
                button.normalImage
                    .setTexture(`quiz-option-${OPTION_KEYS[index]}-correct`)
                    .setAlpha(1);
            } else if (index === selectedIndex) {
                button.normalImage
                    .setTexture(`quiz-option-${OPTION_KEYS[index]}-incorrect`)
                    .setAlpha(1);
            }
        });

        this.feedbackText.setText(isCorrect ? "Correct!" : "Incorrect!");
        this.feedbackText.setColor(isCorrect ? "#4ade80" : "#f87171");

        if (this.onAnswer) {
            this.onAnswer(isCorrect, selectedIndex, false);
        }
    }

    handleTimeout() {
        if (this.locked) return;
        this.locked = true;
        this.stopTimer();
        this.buttons.forEach((button) => button.setEnabled(false));
        this.feedbackText.setText("Time's up!").setColor("#f87171");
        if (this.onAnswer) this.onAnswer(false, -1, true);
    }

    stopTimer() {
        if (!this.timerEvent) return;
        this.scene.time.removeEvent(this.timerEvent);
        this.timerEvent = null;
    }

    pauseTimer() {
        if (this.timerEvent) this.timerEvent.paused = true;
    }

    resumeTimer() {
        if (this.timerEvent) this.timerEvent.paused = false;
    }

    disable() {
        this.buttons.forEach((button) => button.setEnabled(false));
    }

    enable() {
        this.buttons.forEach((button) => button.setEnabled(true));
    }

    clearButtons() {
        this.buttons.forEach((button) => button.destroy());
        this.buttons = [];
        this.locked = false;
    }

    destroy() {
        this.stopTimer();
        this.clearButtons();
        this.questionText.destroy();
        this.panelImage.destroy();
        this.feedbackText.destroy();
        this.timerText.destroy();
    }
}
