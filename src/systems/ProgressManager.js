import { CURRICULUM } from "./curriculum.js";

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
}