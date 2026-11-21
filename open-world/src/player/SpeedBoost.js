const MULTIPLIER = 1.8;
const DURATION = 5;

/** Banked pineapple skill: press Q to sprint for DURATION seconds. One use per fruit. */
export class SpeedBoost {
  constructor(worm, hud) {
    this.worm = worm;
    this.hud = hud;
    this.available = false;
    this.remaining = 0;
  }

  get active() {
    return this.remaining > 0;
  }

  /** Called when a pineapple is eaten. Ignored while one is banked or running. */
  grant() {
    if (this.available || this.remaining > 0) return;
    this.available = true;
    this.hud.setSkillAvailable('Q');
  }

  tryActivate() {
    if (!this.available || this.remaining > 0) return;
    this.available = false;
    this.remaining = DURATION;
    this.worm.speedMultiplier = MULTIPLIER;
  }

  update(dt) {
    if (this.remaining <= 0) return;
    this.remaining -= dt;
    if (this.remaining <= 0) {
      this.remaining = 0;
      this.worm.speedMultiplier = 1;
      this.hud.clearSkill('Q');
    } else {
      this.hud.setSkillActive('Q', this.remaining, DURATION);
    }
  }
}
