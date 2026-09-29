import { createSpriteShadow } from "../ui/sceneEffects.js";

export default class Player {
    constructor(scene, x, y, character = "male", name = "Adventurer", stats = {}) {
        this.scene = scene;
        this.name = name;
        this.character = character;

        const fallback = character === "female"
            ? { maxHp: 15, attackPower: 8 }
            : { maxHp: 20, attackPower: 6 };

        this.level = stats.level ?? 1;
        this.maxHp = stats.maxHp ?? fallback.maxHp;
        this.hp = this.maxHp;
        this.attackPower = stats.attackPower ?? fallback.attackPower;

        const textureKey = character === "female" ? "player-female" : "player-male";

        this.shadow = createSpriteShadow(scene, x, y, textureKey, 0.6);
        this.sprite = scene.add.sprite(x, y, textureKey).setOrigin(0.5).setScale(0.6);
        this.sprite.postFX?.addGlow(0x60a5fa, 0.8, 1, false, 0.2, 4);

        this.baseX = x;
        this.baseY = y;
    }

    attack(target) {
        this.playAttackAnimation(() => {
            target.takeDamage(this.attackPower);
        });
    }

    takeDamage(amount) {
        this.hp = Math.max(0, this.hp - amount);
        this.playHurtAnimation();
        return this.hp;
    }

    heal(amount) {
        this.hp = Math.min(this.maxHp, this.hp + amount);
        return this.hp;
    }

    isAlive() {
        return this.hp > 0;
    }

    playAttackAnimation(onComplete) {
        this.scene.tweens.add({
            targets: [this.sprite, this.shadow],
            x: this.baseX + 40,
            duration: 150,
            yoyo: true,
            onYoyo: onComplete,
        });
    }

    playHurtAnimation() {
        this.sprite.setTintFill(0xff6b6b);

        this.scene.tweens.add({
            targets: [this.sprite, this.shadow],
            x: this.baseX - 10,
            duration: 60,
            yoyo: true,
            repeat: 2,
            onComplete: () => this.sprite.clearTint(),
        });
    }

    destroy() {
        this.sprite.destroy();
        this.shadow.destroy();
    }
}