export default class Player {
    constructor(scene, x, y, character = "male", name = "Adventurer") {
        this.scene = scene;
        this.name = name;
        this.character = character;

        this.maxHp = 100;
        this.hp = 100;
        this.attackPower = 15;

        const textureKey = character === "female" ? "player-female" : "player-male";

        this.sprite = scene.add.sprite(x, y, textureKey).setOrigin(0.5).setScale(0.6);

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
            targets: this.sprite,
            x: this.baseX + 40,
            duration: 150,
            yoyo: true,
            onYoyo: onComplete,
        });
    }

    playHurtAnimation() {
        this.sprite.setTintFill(0xff6b6b);

        this.scene.tweens.add({
            targets: this.sprite,
            x: this.baseX - 10,
            duration: 60,
            yoyo: true,
            repeat: 2,
            onComplete: () => this.sprite.clearTint(),
        });
    }

    destroy() {
        this.sprite.destroy();
    }
}