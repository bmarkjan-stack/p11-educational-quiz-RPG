import { CURRICULUM, CAPSTONE_LESSON } from "./curriculum.js";

const STORAGE_KEY = "learnquest-progress";
const PROGRESS_VERSION = 2;

function defaultProgress() {
    const lessons = {};

    Object.entries(CURRICULUM).forEach(([id, def]) => {
        lessons[id] = {
            unlocked: def.requires.length === 0,
            completed: false,
            bestBattleScore: 0,
            bestExamScore: 0,
            bestAccuracy: 0,
        };
    });

    return {
        version: PROGRESS_VERSION,
        character: null,
        characterName: null,
        lessons,
        dailyChallenge: {
            streak: 0,
            longestStreak: 0,
            totalSolved: 0,
            lastCompletedDate: null, // "YYYY-MM-DD", local date
        },
    };
}

export default class ProgressManager {
    constructor() {
        this.progress = this.load();
    }

    load() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);

            if (!raw) {
                return defaultProgress();
            }

            const parsed = JSON.parse(raw);

            // If the curriculum shape has changed since this save was made,
            // start fresh rather than risk a corrupted/partial progress object.
            if (parsed.version !== PROGRESS_VERSION) {
                return defaultProgress();
            }

            const defaults = defaultProgress();

            const merged = {
                ...defaults,
                ...parsed,
                lessons: {
                    ...defaults.lessons,
                    ...(parsed.lessons || {}),
                },
            };

            return merged;
        } catch (error) {
            console.warn("Could not load progress, using defaults.", error);
            return defaultProgress();
        }
    }

    save() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.progress));
        } catch (error) {
            console.warn("Could not save progress.", error);
        }
    }

    setCharacter(character, characterName) {
        this.progress.character = character;
        this.progress.characterName = characterName;
        this.save();
    }

    getCharacter() {
        return {
            character: this.progress.character,
            characterName: this.progress.characterName,
        };
    }

    getLessonStatus(id) {
        return this.progress.lessons[id] || null;
    }

    isUnlocked(id) {
        return !!this.progress.lessons[id]?.unlocked;
    }

    isCompleted(id) {
        return !!this.progress.lessons[id]?.completed;
    }

    recordBattleResult(id, score) {
        const lesson = this.progress.lessons[id];
        if (!lesson) return;

        lesson.bestBattleScore = Math.max(lesson.bestBattleScore, score);
        this.save();
    }

    markLessonComplete(id, { examScore, accuracy, passed }) {
        const lesson = this.progress.lessons[id];
        if (!lesson) return;

        lesson.bestExamScore = Math.max(lesson.bestExamScore, examScore);
        lesson.bestAccuracy = Math.max(lesson.bestAccuracy, accuracy);

        if (passed) {
            lesson.completed = true;
            this.recomputeUnlocks();
        }

        this.save();
    }

    // Walks the whole curriculum graph and unlocks any lesson whose
    // prerequisites are now all completed. Handles single- and
    // multi-prerequisite lessons alike (e.g. the capstone exam).
    recomputeUnlocks() {
        Object.entries(CURRICULUM).forEach(([id, def]) => {
            const lesson = this.progress.lessons[id];
            if (!lesson || lesson.unlocked) return;

            const requirementsMet = def.requires.every(
                (requiredId) => this.progress.lessons[requiredId]?.completed
            );

            if (requirementsMet) {
                lesson.unlocked = true;
            }
        });
    }

    isTrackComplete(trackLessonIds) {
        return trackLessonIds.every((id) => this.isCompleted(id));
    }

    // --- Daily Coding Challenges (bonus chapter, unlocked after the capstone) ---

    isDailyChallengeUnlocked() {
        return this.isCompleted(CAPSTONE_LESSON);
    }

    getDailyChallengeStats() {
        return { ...this.progress.dailyChallenge };
    }

    hasCompletedTodayChallenge() {
        return this.progress.dailyChallenge.lastCompletedDate === this.getDateString(0);
    }

    recordDailyChallengeResult(isCorrect) {
        const dailyChallenge = this.progress.dailyChallenge;
        const today = this.getDateString(0);

        if (dailyChallenge.lastCompletedDate === today) {
            // Already recorded today — don't let repeated answers inflate the streak.
            return;
        }

        if (isCorrect) {
            const yesterday = this.getDateString(-1);
            dailyChallenge.streak =
                dailyChallenge.lastCompletedDate === yesterday ? dailyChallenge.streak + 1 : 1;
            dailyChallenge.longestStreak = Math.max(dailyChallenge.longestStreak, dailyChallenge.streak);
            dailyChallenge.totalSolved += 1;
        } else {
            dailyChallenge.streak = 0;
        }

        dailyChallenge.lastCompletedDate = today;
        this.save();
    }

    getDateString(dayOffset = 0) {
        const date = new Date();
        date.setDate(date.getDate() + dayOffset);
        return date.toISOString().slice(0, 10);
    }

    resetProgress() {
        this.progress = defaultProgress();
        this.save();
    }
}