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
const HP_PER_LEVEL = 2;
const ATTACK_PER_LEVEL = 1.5;
const XP_PER_LEVEL_BASE = 30;
const XP_GROWTH = 1.25;
const NORMAL_MOB_HP_MULTIPLIER = 2.7;
const NORMAL_MOB_DAMAGE_MULTIPLIER = 0.6;
const BOSS_HP_MULTIPLIER = 15.5;
const BOSS_DAMAGE_MULTIPLIER = 0.13;
const FULLSTACK_BOSS_HP_MULTIPLIER = 17;
const FULLSTACK_BOSS_DAMAGE_MULTIPLIER = 0.14;
const FINAL_BOSS_HP_MULTIPLIER = 19.5;

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
            xpToNextLevel: this.getXpRequired(1),
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

        const stats = this.progress.characterStats;
        const expectedXp = this.getXpRequired(stats.level);

        // Repair saves made with the previous curve, including the old level-1
        // threshold of zero, without resetting the player's progress.
        if (stats.xpToNextLevel !== expectedXp || stats.xpToNextLevel <= 0) {
            stats.xpToNextLevel = expectedXp;
            this.save();
        }

        return stats;
    }

    getXpRequired(level) {
        return Math.floor(XP_PER_LEVEL_BASE * Math.pow(XP_GROWTH, Math.max(0, level - 1)));
    }

    scaleEnemyStats(enemyConfig, { isBoss = false, isFinalBoss = false } = {}) {
        const stats = this.getCharacterStats();
        const hpMultiplier = isFinalBoss
            ? FINAL_BOSS_HP_MULTIPLIER
            : isBoss
                ? enemyConfig.fullStack
                    ? FULLSTACK_BOSS_HP_MULTIPLIER
                    : BOSS_HP_MULTIPLIER
                : NORMAL_MOB_HP_MULTIPLIER;
        const damageMultiplier = isBoss
            ? enemyConfig.fullStack
                ? FULLSTACK_BOSS_DAMAGE_MULTIPLIER
                : BOSS_DAMAGE_MULTIPLIER
            : NORMAL_MOB_DAMAGE_MULTIPLIER;
        const difficulty = enemyConfig.difficulty ?? 1;
        const attackMultiplier = enemyConfig.attackMultiplier ?? 1;

        return {
            ...enemyConfig,
            maxHp: Math.ceil(stats.attackPower * hpMultiplier * difficulty),
            attackPower: Math.max(
                1,
                Math.ceil(stats.maxHp * damageMultiplier * attackMultiplier)
            ),
        };
    }

    scaleFullStackBossStats(enemyConfig, hitsToDefeat) {
        const stats = this.getCharacterStats();

        return {
            ...enemyConfig,
            maxHp: stats.attackPower * Math.max(1, hitsToDefeat - 1) + 1,
            attackPower: Math.max(
                1,
                Math.ceil(stats.maxHp * BOSS_DAMAGE_MULTIPLIER)
            ),
        };
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
            const levelHpGained = Math.floor(HP_PER_LEVEL * (stats.level * 0.35)) + 1;
            const levelDamageGained = Math.floor(ATTACK_PER_LEVEL * (stats.level * 0.25)) + 1;
            stats.maxHp += levelHpGained;
            stats.attackPower += levelDamageGained;
            maxHpGained += levelHpGained;
            damageGained += levelDamageGained;
            stats.xpToNextLevel = this.getXpRequired(stats.level);
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