import Phaser from "phaser";

export default class LessonSelectScene extends Phaser.Scene {
    constructor() {
        super("LessonSelectScene");
    }

    create() {
        this.drawBackground();

        if (this.courseId) {
            this.createLessonList(this.courseId);
        } else {
            this.createCourseList();
        }
    }
}