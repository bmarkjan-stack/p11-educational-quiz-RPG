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

function inferCharacterType(stats) {
    let closestCharacter = "male";
    let smallestDifference = Infinity;

    Object.entries(BASE_STATS).forEach(([character, baseStats]) => {
        let maxHp = baseStats.maxHp;
        let attackPower = baseStats.attackPower;

        for (let level = 2; level <= stats.level; level += 1) {
            maxHp += HP_PER_LEVEL;
            attackPower += ATTACK_PER_LEVEL;
        }

        const difference = Math.abs(maxHp - stats.maxHp) + Math.abs(attackPower - stats.attackPower);
        if (difference < smallestDifference) {
            closestCharacter = character;
            smallestDifference = difference;
        }
    });

    return closestCharacter;
}

// Flat stat growth applied on every level up.
const HP_PER_LEVEL = 2;
const ATTACK_PER_LEVEL = 1;
const XP_PER_LEVEL_BASE = 30;

const NORMAL_MOB_HITS_TO_DEFEAT = 3;
const NORMAL_MOB_PLAYER_HITS_TO_DEFEAT = 2;
const STANDARD_BOSS_HITS_TO_DEFEAT = 16;
const STANDARD_BOSS_PLAYER_HITS_TO_DEFEAT = 8;
const FULLSTACK_PHASE_1_HITS_TO_DEFEAT = 5;
const FULLSTACK_PHASE_2_HITS_TO_DEFEAT = 10;
const FULLSTACK_BOSS_PLAYER_HITS_TO_DEFEAT = 8;
const FINAL_BOSS_PHASE_1_HITS_TO_DEFEAT = 15;
const FINAL_BOSS_PHASE_2_HITS_TO_DEFEAT = 30;
const FINAL_BOSS_PLAYER_HITS_TO_DEFEAT = 16;

// Exact damage so the target dies on precisely the Nth hit
// (e.g. 20 HP / 8 hits = 2.5 damage per hit; the 8th hit lands at 0 HP).
function getEnemyDamageForDesiredHits(targetHp, desiredHits) {
    if (desiredHits <= 1) {
        return Math.max(1, targetHp);
    }

    return targetHp / desiredHits;
}

function getEncounterHitTarget({
    isBoss = false,
    isFinalBoss = false,
    fullStack = false,
    phase = 1,
    hitsToDefeat,
} = {}) {
    if (Number.isInteger(hitsToDefeat) && hitsToDefeat > 0) {
        return hitsToDefeat;
    }

    if (isFinalBoss) {
        return phase === 1
            ? FINAL_BOSS_PHASE_1_HITS_TO_DEFEAT
            : FINAL_BOSS_PHASE_2_HITS_TO_DEFEAT;
    }

    if (isBoss) {
        return fullStack
            ? (phase === 1 ? FULLSTACK_PHASE_1_HITS_TO_DEFEAT : FULLSTACK_PHASE_2_HITS_TO_DEFEAT)
            : STANDARD_BOSS_HITS_TO_DEFEAT;
    }

    return NORMAL_MOB_HITS_TO_DEFEAT;
}

function getPlayerHitTarget({
    isBoss = false,
    isFinalBoss = false,
    fullStack = false,
    hitsToDefeatPlayer,
} = {}) {
    if (Number.isInteger(hitsToDefeatPlayer) && hitsToDefeatPlayer > 0) {
        return hitsToDefeatPlayer;
    }

    if (isFinalBoss) {
        return FINAL_BOSS_PLAYER_HITS_TO_DEFEAT;
    }

    if (isBoss) {
        return fullStack
            ? FULLSTACK_BOSS_PLAYER_HITS_TO_DEFEAT
            : STANDARD_BOSS_PLAYER_HITS_TO_DEFEAT;
    }

    return NORMAL_MOB_PLAYER_HITS_TO_DEFEAT;
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

        // Only (re)initialize stats when there are none yet, or the
        // player picked a different class than the one already saved.
        // Continuing with the same class must never reset level/xp.
        if (!this.progress.characterStats) {
            this.progress.characterStats = this.createBaseStats(character);
        } else if (!this.progress.characterStats.type) {
            this.progress.characterStats.type = character;
        } else if (this.progress.characterStats.type !== character) {
            this.progress.characterStats = this.createBaseStats(character);
        }

        this.save();
    }

    getCharacter() {
        const stats = this.progress.characterStats;
        return {
            character: this.progress.character ?? stats?.type ?? (stats ? inferCharacterType(stats) : null),
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
        return XP_PER_LEVEL_BASE * Math.max(1, level);
    }

    scaleEnemyStats(
        enemyConfig,
        {
            isBoss = false,
            isFinalBoss = false,
            fullStack = false,
            phase = 1,
            hitsToDefeat = null,
            hitsToDefeatPlayer = null,
            oneHitKill = false,
        } = {}
    ) {
        const stats = this.getCharacterStats();
        const targetHits = oneHitKill ? 1 : getEncounterHitTarget({
            isBoss,
            isFinalBoss,
            fullStack,
            phase,
            hitsToDefeat,
        });
        const playerHits = getPlayerHitTarget({
            isBoss,
            isFinalBoss,
            fullStack,
            hitsToDefeatPlayer,
        });

        return {
            ...enemyConfig,
            maxHp: Math.max(1, stats.attackPower * targetHits),
            attackPower: getEnemyDamageForDesiredHits(stats.maxHp, playerHits),
        };
    }

    // Frontend finished but backend not: the player has out-levelled the
    // backend intro and one-shots the Python mobs.
    isPythonOverpowered(lessonId) {
        return (
            lessonId === "python" &&
            this.isTrackComplete(["responsive-web-design", "javascript", "frontend-libraries"]) &&
            !this.isTrackComplete(["python", "relational-databases", "backend-apis"])
        );
    }

    scaleFullStackBossStats(enemyConfig, hitsToDefeat, hitsToDefeatPlayer = FULLSTACK_BOSS_PLAYER_HITS_TO_DEFEAT) {
        const stats = this.getCharacterStats();

        return {
            ...enemyConfig,
            maxHp: Math.max(1, stats.attackPower * Math.max(1, hitsToDefeat)),
            attackPower: getEnemyDamageForDesiredHits(stats.maxHp, hitsToDefeatPlayer),
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
            const levelHpGained = HP_PER_LEVEL;
            const levelDamageGained = ATTACK_PER_LEVEL;
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