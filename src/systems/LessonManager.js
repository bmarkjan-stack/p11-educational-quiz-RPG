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