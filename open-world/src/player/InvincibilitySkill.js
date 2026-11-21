const DURATION = 5;

/** Banked aloe vera skill: press R to become invincible for DURATION seconds. */
export class InvincibilitySkill {
  constructor(worm, hud) {
    this.worm = worm;
    this.hud = hud;
    this.available = false;
    this.remaining = 0;
  }

  /** Called when an aloe vera is eaten. Ignored while one is banked or running. */
  grant() {
    if (this.available || this.remaining > 0) return;
    this.available = true;
    this.hud.setSkillAvailable('R');
  }

  tryActivate() {
    if (!this.available || this.remaining > 0) return;
    this.available = false;
    this.remaining = DURATION;
    this.worm.invincibilityRemaining = Math.max(this.worm.invincibilityRemaining, DURATION);
  }

  update(dt) {
    if (this.remaining <= 0) return;
    this.remaining -= dt;
    if (this.remaining <= 0) {
      this.remaining = 0;
      this.hud.clearSkill('R');
    } else {
      this.hud.setSkillActive('R', this.remaining, DURATION);
    }
  }
}
