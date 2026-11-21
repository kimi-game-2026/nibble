export class Hud {
  constructor({ character = 'Nibble', form = 'Worm' } = {}) {
    this.root = document.createElement('div');
    this.root.id = 'hud';

    this.portrait = document.createElement('div');
    this.portrait.className = 'portrait';
    this.portrait.appendChild(this.#drawPortrait());

    this.label = document.createElement('div');
    this.label.className = 'label';

    this.bar = document.createElement('div');
    this.bar.className = 'xp-bar';
    this.fill = document.createElement('div');
    this.fill.className = 'xp-fill';
    this.bar.appendChild(this.fill);

    this.root.append(this.portrait, this.bar, this.label);
    document.body.appendChild(this.root);

    this.setCharacter(character, form);
    this.setExperience(0);
  }

  /** ratio in [0, 1] */
  setExperience(ratio) {
    this.fill.style.width = `${Math.min(1, Math.max(0, ratio)) * 100}%`;
  }

  setCharacter(name, form = 'Worm') {
    this.label.textContent = `${name} - ${form}`;
  }

  /** Brief glow flash on the XP bar (e.g. on level-up). */
  pulse() {
    this.bar.classList.remove('level-up');
    void this.bar.offsetWidth; // restart the CSS animation
    this.bar.classList.add('level-up');
  }

  #drawPortrait() {
    const canvas = document.createElement('canvas');
    const s = 256;
    canvas.width = s;
    canvas.height = s;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#dff1fa';
    ctx.fillRect(0, 0, s, s);

    // body segments trailing lower-left
    ctx.fillStyle = '#d97f86';
    ctx.beginPath(); ctx.arc(56, 196, 34, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(92, 168, 42, 0, Math.PI * 2); ctx.fill();
    // head
    ctx.fillStyle = '#e5989b';
    ctx.beginPath(); ctx.arc(150, 128, 62, 0, Math.PI * 2); ctx.fill();
    // eyes
    ctx.fillStyle = '#26221f';
    ctx.beginPath(); ctx.arc(134, 112, 8, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(170, 112, 8, 0, Math.PI * 2); ctx.fill();
    // smile
    ctx.strokeStyle = '#26221f';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(152, 138, 18, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke();

    return canvas;
  }
}
