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
        const requiredFields = ["id", "title", "sections", "exam"];

        requiredFields.forEach((field) => {
            if (!(field in lesson)) {
                throw new Error(`Lesson is missing required field "${field}".`);
            }
        });

        if (!Array.isArray(lesson.sections) || lesson.sections.length === 0) {
            throw new Error(`Lesson "${lesson.id}" must have at least one section.`);
        }

        lesson.sections.forEach((section, sectionIndex) => {
            const sectionQuestions = lesson.id === "fullstack-exam"
                ? section.exam
                : section.quiz;

            if (!Array.isArray(sectionQuestions) || sectionQuestions.length === 0) {
                throw new Error(
                    `Section ${sectionIndex} ("${section.id}") in "${lesson.id}" must have its own quiz or exam.`
                );
            }

            sectionQuestions.forEach((question, questionIndex) =>
                this.validateQuestion(
                    question,
                    `${lesson.id} / section "${section.id}" / exam question ${questionIndex}`
                )
            );
        });

        if (!Array.isArray(lesson.exam) || lesson.exam.length === 0) {
            throw new Error(`Lesson "${lesson.id}" must have at least one exam question.`);
        }

        lesson.exam.forEach((question, questionIndex) =>
            this.validateQuestion(question, `${lesson.id} / exam question ${questionIndex}`)
        );
    }

    validateQuestion(question, context) {
        if (!question.question || !Array.isArray(question.choices)) {
            throw new Error(`Malformed question at ${context}.`);
        }

        if (
            typeof question.answer !== "number" ||
            question.answer < 0 ||
            question.answer >= question.choices.length
        ) {
            throw new Error(`Invalid answer index at ${context}.`);
        }
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

    getSectionQuiz(sectionIndex) {
        const section = this.activeLesson?.sections?.[sectionIndex];
        return section?.quiz ?? section?.exam ?? [];
    }

    getExam() {
        return this.activeLesson?.exam ?? [];
    }
}
