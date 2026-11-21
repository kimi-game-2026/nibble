import { CHARACTERS, MAX_LEVEL } from '../../placeholders/characters/index.js';

export class Experience {
  constructor(hud, { characters = CHARACTERS } = {}) {
    this.hud = hud;
    this.characters = characters;
    this.level = 1;
    this.xp = 0;
    this.character = characters[0];
    this.levelUpCb = null;
  }

  onLevelUp(cb) {
    this.levelUpCb = cb;
  }

  gain(amount = 1) {
    if (this.level >= MAX_LEVEL) {
      this.hud.setExperience(1); // max level: bar stays full
      return;
    }
    this.xp += amount;
    if (this.xp >= this.character.xpToNext) {
      this.xp = 0;
      this.level++;
      this.character = this.characters[this.level - 1];
      this.hud.setExperience(0);
      this.hud.pulse();
      this.levelUpCb?.(this.character, this.level);
    } else {
      this.hud.setExperience(this.xp / this.character.xpToNext);
    }
  }
}
