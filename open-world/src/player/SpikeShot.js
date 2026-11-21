/** Banked durian skill: press E to fire a spike straight ahead. One use per fruit. */
export class SpikeShot {
  constructor(worm, hud, spike) {
    this.worm = worm;
    this.hud = hud;
    this.spike = spike;
    this.available = false;
  }

  /** Called when a durian is eaten. Ignored while one is already banked. */
  grant() {
    if (this.available) return;
    this.available = true;
    this.hud.setSkillAvailable('E');
  }

  /** Fires the spike if one is banked. Returns true on fire (so the caller can play the quip). */
  tryActivate() {
    if (!this.available) return false;
    this.available = false;
    this.hud.clearSkill('E');
    this.spike.fire(this.worm.position, this.worm.heading);
    return true;
  }
}
