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