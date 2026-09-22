import Phaser from "phaser";

export default class QuizManager {
    constructor(questions, { randomizeOrder = true } = {}) {
        this.originalQuestions = questions;

        this.questions = randomizeOrder
            ? Phaser.Utils.Array.Shuffle([...questions])
            : [...questions];

        this.currentIndex = 0;
        this.correctCount = 0;
        this.incorrectCount = 0;
        this.answered = false;
    }

    getCurrentQuestion() {
        return this.questions[this.currentIndex] ?? null;
    }

    checkAnswer(selectedIndex) {
        if (this.answered) {
            return null;
        }

        const question = this.getCurrentQuestion();
        if (!question) return null;

        const isCorrect = selectedIndex === question.answer;

        this.answered = true;

        if (isCorrect) {
            this.correctCount += 1;
        } else {
            this.incorrectCount += 1;
        }

        return isCorrect;
    }

    next({ repeatCurrent = false } = {}) {
        const currentQuestion = this.getCurrentQuestion();

        this.currentIndex += 1;

        if (repeatCurrent && currentQuestion) {
            this.questions.push(currentQuestion);
        }

        this.answered = false;
        return this.getCurrentQuestion();
    }

    isComplete() {
        return this.currentIndex >= this.questions.length;
    }

    getProgress() {
        return {
            current: Math.min(this.currentIndex + 1, this.questions.length),
            total: this.questions.length,
        };
    }

    getResults() {
        const total = this.correctCount + this.incorrectCount;
        const accuracy = total === 0 ? 0 : Math.round((this.correctCount / total) * 100);

        return {
            correct: this.correctCount,
            incorrect: this.incorrectCount,
            total,
            accuracy,
        };
    }

    reset() {
        this.questions = Phaser.Utils.Array.Shuffle([...this.originalQuestions]);
        this.currentIndex = 0;
        this.correctCount = 0;
        this.incorrectCount = 0;
        this.answered = false;
    }
}