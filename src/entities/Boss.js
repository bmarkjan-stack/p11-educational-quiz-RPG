import { createSpriteShadow } from "../ui/sceneEffects.js";

export default class Boss {
    constructor(
        scene,
        x,
        y,
        {
            textureKey,
            name = "Enemy",
            maxHp = 100,
            attackPower = 10,
            scale = 0.6,
        } = {}
    ) {
        this.scene = scene;
        this.name = name;
        this.maxHp = maxHp;
        this.hp = maxHp;
        this.attackPower = attackPower;
        this.scale = scale;

        this.shadow = createSpriteShadow(scene, x, y, textureKey, scale);
        this.sprite = scene.add.sprite(x, y, textureKey).setOrigin(0.5).setScale(scale);
        this.sprite.postFX?.addGlow(0xf87171, 0.8, 1, false, 0.2, 4);

        this.baseX = x;
        this.baseY = y;
    }

    transform({ textureKey, name, maxHp, attackPower, scale = this.scale }) {
        this.name = name;
        this.maxHp = maxHp;
        this.hp = maxHp;
        this.attackPower = attackPower;
        this.scale = scale;
        this.sprite.setTexture(textureKey).setAlpha(1).setScale(scale);
        this.shadow
            .setPosition(this.sprite.x, this.baseY + this.sprite.displayHeight * 0.43)
            .setDisplaySize(
                this.sprite.displayWidth * 0.56,
                Math.max(14, this.sprite.displayHeight * 0.075)
            );
    }

    attack(target) {
        // The attack tween has two targets (sprite + shadow) and Phaser fires
        // onYoyo once per target, so guard to apply the damage exactly once.
        let damageApplied = false;
        this.playAttackAnimation(() => {
            if (damageApplied) return;
            damageApplied = true;
            target.takeDamage(this.attackPower);
        });
    }

    takeDamage(amount) {
        const remaining = this.hp - amount;
        // Snap tiny floating-point remainders to 0 so N exact hits always kill.
        this.hp = remaining < 0.0001 ? 0 : Math.round(remaining * 10000) / 10000;
        this.playHurtAnimation();
        return this.hp;
    }

    isAlive() {
        return this.hp > 0;
    }

    playAttackAnimation(onComplete) {
        this.scene.tweens.add({
            targets: [this.sprite, this.shadow],
            x: this.baseX - 40,
            duration: 150,
            yoyo: true,
            onYoyo: onComplete,
        });
    }

    playHurtAnimation() {
        this.sprite.setTintFill(0xff6b6b);

        this.scene.tweens.add({
            targets: [this.sprite, this.shadow],
            x: this.baseX + 10,
            duration: 60,
            yoyo: true,
            repeat: 2,
            onComplete: () => this.sprite.clearTint(),
        });
    }

    playDefeatAnimation(onComplete) {
        this.scene.tweens.add({
            targets: [this.sprite, this.shadow],
            alpha: 0,
            scale: 0.2,
            duration: 500,
            onComplete,
        });
    }

    destroy() {
        this.sprite.destroy();
        this.shadow.destroy();
    }
}
