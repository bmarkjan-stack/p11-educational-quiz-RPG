import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.localStorage = {
  store: {},
  getItem(key) {
    return Object.prototype.hasOwnProperty.call(this.store, key) ? this.store[key] : null;
  },
  setItem(key, value) {
    this.store[key] = String(value);
  },
  removeItem(key) {
    delete this.store[key];
  },
};

const { default: ProgressManager } = await import('../src/systems/ProgressManager.js');

test('XP thresholds and level rewards use the fixed linear progression', () => {
  const progressManager = new ProgressManager();

  assert.equal(progressManager.getXpRequired(1), 30);
  assert.equal(progressManager.getXpRequired(2), 60);
  assert.equal(progressManager.getXpRequired(3), 90);

  progressManager.progress.characterStats = {
    type: 'female',
    level: 1,
    xp: 0,
    xpToNextLevel: 30,
    maxHp: 15,
    attackPower: 8,
  };

  const result = progressManager.addExperience(30);

  assert.equal(result.stats.level, 2);
  assert.equal(result.stats.maxHp, 17);
  assert.equal(result.stats.attackPower, 9);
});

test('enemy hit-count rules scale from the player stats instead of legacy multipliers', () => {
  const progressManager = new ProgressManager();
  progressManager.progress.characterStats = {
    type: 'female',
    level: 1,
    xp: 0,
    xpToNextLevel: 30,
    maxHp: 15,
    attackPower: 8,
  };

  const normalMob = progressManager.scaleEnemyStats({ name: 'Variable Ghost' });
  assert.equal(normalMob.maxHp, 24);
  assert.equal(normalMob.attackPower, 8);

  const boss = progressManager.scaleEnemyStats({ name: 'Boss' }, { isBoss: true });
  assert.equal(boss.maxHp, 128);
  assert.equal(boss.attackPower, 2);
});
