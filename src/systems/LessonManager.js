export default class LessonManager {
    constructor() {
        this.lessons = {};
        this.activeLesson = null;
    }

    async loadLesson(id) {
        if (this.lessons[id]) {
            this.activeLesson = this.lessons[id];
            return this.activeLesson;
        }

        const response = await fetch(`/data/lessons/${id}.json`);

        if (!response.ok) {
            throw new Error(`Failed to load lesson "${id}" (${response.status})`);
        }

        const lesson = await response.json();

        this.validate(lesson);

        this.lessons[id] = lesson;
        this.activeLesson = lesson;

        return lesson;
    }

    validate(lesson) {
        const requiredFields = ["id", "title", "sections", "quiz", "exam"];

        requiredFields.forEach((field) => {
            if (!(field in lesson)) {
                throw new Error(`Lesson is missing required field "${field}".`);
            }
        });

        if (!Array.isArray(lesson.sections) || lesson.sections.length === 0) {
            throw new Error(`Lesson "${lesson.id}" must have at least one section.`);
        }

        [...lesson.quiz, ...lesson.exam].forEach((question, index) => {
            if (!question.question || !Array.isArray(question.choices)) {
                throw new Error(`Question ${index} in "${lesson.id}" is malformed.`);
            }

            if (
                typeof question.answer !== "number" ||
                question.answer < 0 ||
                question.answer >= question.choices.length
            ) {
                throw new Error(`Question ${index} in "${lesson.id}" has an invalid answer index.`);
            }
        });
    }

    setActiveLesson(lesson) {
        this.activeLesson = lesson;
    }

    getActiveLesson() {
        return this.activeLesson;
    }

    getSections() {
        return this.activeLesson?.sections ?? [];
    }

    getQuiz() {
        return this.activeLesson?.quiz ?? [];
    }

    getExam() {
        return this.activeLesson?.exam ?? [];
    }
}
