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

        this.sprite = scene.add.sprite(x, y, textureKey).setOrigin(0.5).setScale(scale);

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

    isAlive() {
        return this.hp > 0;
    }

    playAttackAnimation(onComplete) {
        this.scene.tweens.add({
            targets: this.sprite,
            x: this.baseX - 40,
            duration: 150,
            yoyo: true,
            onYoyo: onComplete,
        });
    }

    playHurtAnimation() {
        this.sprite.setTintFill(0xff6b6b);

        this.scene.tweens.add({
            targets: this.sprite,
            x: this.baseX + 10,
            duration: 60,
            yoyo: true,
            repeat: 2,
            onComplete: () => this.sprite.clearTint(),
        });
    }

    playDefeatAnimation(onComplete) {
        this.scene.tweens.add({
            targets: this.sprite,
            alpha: 0,
            scale: 0.2,
            duration: 500,
            onComplete,
        });
    }

    destroy() {
        this.sprite.destroy();
    }
}
