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
        characterStats: null,
        lastVisitedLesson: null,
        lessonCheckpoints: {},
        lessons,
        dailyChallenge: {
            streak: 0,
            longestStreak: 0,
            totalSolved: 0,
            lastCompletedDate: null, // "YYYY-MM-DD", local date
        },
    };
}

// Base stats per character class (requirement: male = 20hp/6dmg, female = 15hp/8dmg).
const BASE_STATS = {
    male: { maxHp: 20, attackPower: 6 },
    female: { maxHp: 15, attackPower: 8 },
};

// Flat stat growth applied on every level up.
const HP_PER_LEVEL = 3;
const ATTACK_PER_LEVEL = 1;
const XP_PER_LEVEL_BASE = 8;

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

        // Only (re)initialize stats when there are none yet, or the
        // player picked a different class than the one already saved.
        // Continuing with the same class must never reset level/xp.
        if (!this.progress.characterStats || this.progress.characterStats.type !== character) {
            this.progress.characterStats = this.createBaseStats(character);
        }

        this.save();
    }

    getCharacter() {
        return {
            character: this.progress.character,
            characterName: this.progress.characterName,
        };
    }

    createBaseStats(character) {
        const base = BASE_STATS[character] ?? BASE_STATS.male;

        return {
            type: character,
            level: 1,
            xp: 0,
            xpToNextLevel: XP_PER_LEVEL_BASE,
            maxHp: base.maxHp,
            attackPower: base.attackPower,
        };
    }

    getCharacterStats() {
        if (!this.progress.characterStats) {
            this.progress.characterStats = this.createBaseStats(
                this.progress.character || "male"
            );
        }

        return this.progress.characterStats;
    }

    // Adds XP to the saved character and levels up (possibly multiple
    // times) whenever enough XP has been earned. Returns whether a level
    // up happened and the resulting stats, so scenes can show feedback.
    addExperience(amount) {
        const stats = this.getCharacterStats();

        if (!amount || amount <= 0) {
            return {
                leveledUp: false,
                levelsGained: 0,
                maxHpGained: 0,
                damageGained: 0,
                stats: { ...stats },
            };
        }

        stats.xp += amount;

        let levelsGained = 0;
        let maxHpGained = 0;
        let damageGained = 0;

        while (stats.xp >= stats.xpToNextLevel) {
            stats.xp -= stats.xpToNextLevel;
            stats.level += 1;
            const levelHpGained = HP_PER_LEVEL * stats.level;
            const levelDamageGained = ATTACK_PER_LEVEL * stats.level;
            stats.maxHp += levelHpGained;
            stats.attackPower += levelDamageGained;
            maxHpGained += levelHpGained;
            damageGained += levelDamageGained;
            stats.xpToNextLevel = XP_PER_LEVEL_BASE * stats.level;
            levelsGained += 1;
        }

        this.save();

        return {
            leveledUp: levelsGained > 0,
            levelsGained,
            maxHpGained,
            damageGained,
            stats: { ...stats },
        };
    }

    // --- Resume-in-progress lesson tracking (requirements #2, #3, #6) ---

    setLastVisitedLesson(id) {
        this.progress.lastVisitedLesson = id;
        this.save();
    }

    getLastVisitedLesson() {
        return this.progress.lastVisitedLesson;
    }

    saveLessonCheckpoint(lessonId, checkpoint) {
        this.progress.lessonCheckpoints = this.progress.lessonCheckpoints || {};
        this.progress.lessonCheckpoints[lessonId] = { ...checkpoint };
        this.save();
    }

    getLessonCheckpoint(lessonId) {
        return (this.progress.lessonCheckpoints || {})[lessonId] || null;
    }

    clearLessonCheckpoint(lessonId) {
        if (this.progress.lessonCheckpoints && this.progress.lessonCheckpoints[lessonId]) {
            delete this.progress.lessonCheckpoints[lessonId];
            this.save();
        }
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

            // The lesson is finished — there's nothing left to resume.
            if (this.progress.lessonCheckpoints) {
                delete this.progress.lessonCheckpoints[id];
            }
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