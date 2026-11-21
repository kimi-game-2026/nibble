import { CHARACTERS } from '../../placeholders/characters/index.js';

export class Experience {
  constructor(hud, worm, { characters = CHARACTERS } = {}) {
    this.hud = hud;
    this.worm = worm;
    this.characters = characters;
    this.character = characters[0];
    this.levelUpCb = null;
    this.worm.onLevelUp((level) => {
      this.#setCharacter(level);
      this.hud.pulse();
      this.levelUpCb?.(this.character, level);
    });
    this.worm.onLevelDown((level) => this.#setCharacter(level));
    this.#setCharacter(this.worm.level);
    this.update();
  }

  onLevelUp(cb) {
    this.levelUpCb = cb;
  }

  gain(amount = 1) {
    this.worm.addExperience(amount);
    this.update();
  }

  update() {
    const atMax = this.worm.level >= this.worm.maxLevel;
    const required = this.worm.experienceForNextLevel();
    this.hud.setLevel(this.worm.level);
    this.hud.setExperience(
      atMax ? 1 : this.worm.experience / required,
      atMax ? 'MAX' : `${this.worm.experience} / ${required} XP`
    );
    this.hud.setInvincibility(this.worm.invincibilityRemaining);
  }

  #setCharacter(level) {
    this.character = this.characters[level - 1] ?? this.characters[this.characters.length - 1];
    this.hud.setCharacter(this.character.title, this.character.name, this.character.level);
  }
}
