import { LEVEL_COLORS } from '../creatures/CreatureModel.js';

const DARK = '#2b2130';
const SPIKE = '#3d2b3a';

const hex = (c) => `#${c.toString(16).padStart(6, '0')}`;
const shade = (c, f) => `rgb(${(((c >> 16) & 255) * f) | 0}, ${(((c >> 8) & 255) * f) | 0}, ${((c & 255) * f) | 0})`;

export class Hud {
  constructor({ character = 'Nibble', form = 'Worm' } = {}) {
    this.level = 1;
    this.root = document.createElement('div');
    this.root.id = 'hud';

    this.portrait = document.createElement('div');
    this.portrait.className = 'portrait';
    this.portraitCanvas = document.createElement('canvas');
    this.portraitCanvas.width = 256;
    this.portraitCanvas.height = 256;
    this.portrait.appendChild(this.portraitCanvas);

    this.label = document.createElement('div');
    this.label.className = 'label';

    this.bar = document.createElement('div');
    this.bar.className = 'xp-bar';
    this.fill = document.createElement('div');
    this.fill.className = 'xp-fill';
    this.xpText = document.createElement('div');
    this.xpText.className = 'xp-text';
    this.bar.append(this.fill, this.xpText);

    this.invincibility = document.createElement('div');
    this.invincibility.className = 'invincibility';
    this.invincibility.hidden = true;

    this.skillBar = document.createElement('div');
    this.skillBar.className = 'skills';
    this.skills = {
      Q: this.#makeSkillSlot(this.#drawPineappleIcon()),
      E: this.#makeSkillSlot(this.#drawDurianIcon()),
      R: this.#makeSkillSlot(this.#drawAloeIcon()),
    };
    this.skillBar.append(this.skills.Q.root, this.skills.E.root, this.skills.R.root);

    this.root.append(this.portrait, this.bar, this.label, this.invincibility, this.skillBar);
    document.body.appendChild(this.root);

    this.setCharacter(character, form);
    this.setExperience(0, '0 / 5 XP');
  }

  setExperience(ratio, text) {
    this.fill.style.width = `${Math.min(1, Math.max(0, ratio)) * 100}%`;
    this.xpText.textContent = text;
  }

  setLevel(level) {
    this.level = level;
    this.#updateLabel();
  }

  setCharacter(name, form = 'Worm', level = 1) {
    this.name = name;
    this.form = form;
    this.level = level;
    this.#updateLabel();
    this.#drawPortrait(level);
  }

  setInvincibility(seconds) {
    this.invincibility.hidden = seconds <= 0;
    this.invincibility.textContent = `INVINCIBLE ${seconds.toFixed(1)}s`;
  }

  /** Banked skill: show its slot with a pulsing key hint ('Q' or 'E'). */
  setSkillAvailable(key) {
    const slot = this.skills[key];
    slot.root.hidden = false;
    slot.root.classList.add('available');
    slot.root.style.background = 'rgba(255, 255, 255, 0.45)';
    slot.badge.textContent = key;
  }

  /** Timed skill running: drain the ring and count down whole seconds. */
  setSkillActive(key, remaining, duration) {
    const slot = this.skills[key];
    slot.root.hidden = false;
    slot.root.classList.remove('available');
    const deg = Math.max(0, remaining / duration) * 360;
    slot.root.style.background = `conic-gradient(#8fce6a ${deg}deg, rgba(255, 255, 255, 0.35) ${deg}deg)`;
    slot.badge.textContent = Math.ceil(remaining);
  }

  clearSkill(key) {
    const slot = this.skills[key];
    slot.root.hidden = true;
    slot.root.classList.remove('available');
  }

  #makeSkillSlot(iconCanvas) {
    const root = document.createElement('div');
    root.className = 'skill';
    root.hidden = true;
    const inner = document.createElement('div');
    inner.className = 'skill-inner';
    inner.appendChild(iconCanvas);
    const badge = document.createElement('div');
    badge.className = 'skill-badge';
    root.append(inner, badge);
    return { root, badge };
  }

  /** Brief glow flash on the XP bar (e.g. on level-up). */
  pulse() {
    this.bar.classList.remove('level-up');
    void this.bar.offsetWidth; // restart the CSS animation
    this.bar.classList.add('level-up');
  }

  #updateLabel() {
    this.label.textContent = `${this.name} - ${this.form} · LV ${this.level}`;
  }

  /**
   * Redraws the portrait as a side profile of the shared CreatureModel:
   * same level palette, alternating segment shading, back spikes (level 2+),
   * head horns (3+), crown horn (5+), side horns (7+), glowing eyes (3+).
   */
  #drawPortrait(level) {
    const canvas = this.portraitCanvas;
    const s = canvas.width;
    const ctx = canvas.getContext('2d');
    const main = LEVEL_COLORS[Math.min(level, LEVEL_COLORS.length) - 1];
    const body = hex(main);
    const darkBody = shade(main, 0.72);
    const HEAD = { x: 152, y: 126, r: 56 };
    const segCount = 3 + Math.floor((level - 1) / 2);
    const segAt = (i) => {
      const t = (i + 1) / (segCount + 1);
      return { x: HEAD.x - 92 * t, y: HEAD.y + 58 * t, r: HEAD.r * 0.72 * (1 - 0.4 * t) };
    };

    ctx.fillStyle = '#dff1fa';
    ctx.fillRect(0, 0, s, s);

    // legs under the body (side view shows one row)
    ctx.strokeStyle = DARK;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    for (let i = 0; i < segCount; i++) {
      const p = segAt(i);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y + p.r * 0.6);
      ctx.lineTo(p.x - 9, p.y + p.r * 1.25);
      ctx.stroke();
    }

    // body segments, far to near so nearer ones overlap
    for (let i = segCount - 1; i >= 0; i--) {
      const p = segAt(i);
      ctx.fillStyle = i % 2 === 0 ? body : darkBody;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }

    // spikes along the back (skipping the head-adjacent segment, which the head covers)
    ctx.fillStyle = SPIKE;
    for (let i = 1; i < segCount && i <= level - 1; i++) {
      const p = segAt(i);
      const h = 15 * (1 - i * 0.1);
      ctx.beginPath();
      ctx.moveTo(p.x - 8, p.y - p.r * 0.6);
      ctx.lineTo(p.x, p.y - p.r * 0.6 - h);
      ctx.lineTo(p.x + 8, p.y - p.r * 0.6);
      ctx.closePath();
      ctx.fill();
    }

    // head
    ctx.fillStyle = body;
    ctx.beginPath(); ctx.arc(HEAD.x, HEAD.y, HEAD.r, 0, Math.PI * 2); ctx.fill();

    // horns: pair from level 3, crown horn from 5, side horns from 7
    ctx.fillStyle = SPIKE;
    if (level >= 3) {
      const h = 22 + (level - 3) * 3;
      for (const side of [-1, 1]) {
        const bx = HEAD.x + side * 30;
        const by = HEAD.y - HEAD.r * 0.72;
        ctx.beginPath();
        ctx.moveTo(bx - 9, by);
        ctx.lineTo(bx + side * 7, by - h);
        ctx.lineTo(bx + 9, by);
        ctx.closePath();
        ctx.fill();
      }
    }
    if (level >= 5) {
      const h = 26 + (level - 5) * 4;
      const by = HEAD.y - HEAD.r * 0.95;
      ctx.beginPath();
      ctx.moveTo(HEAD.x - 10, by + 8);
      ctx.lineTo(HEAD.x, by - h);
      ctx.lineTo(HEAD.x + 10, by + 8);
      ctx.closePath();
      ctx.fill();
    }
    if (level >= 7) {
      const h = 18 + (level - 7) * 4;
      for (const side of [-1, 1]) {
        const bx = HEAD.x + side * HEAD.r * 0.88;
        const by = HEAD.y + 4;
        ctx.beginPath();
        ctx.moveTo(bx, by - 8);
        ctx.lineTo(bx + side * h, by + 4);
        ctx.lineTo(bx, by + 14);
        ctx.closePath();
        ctx.fill();
      }
    }

    // eyes: dark for the lowest forms, glowing orange from level 3
    if (level >= 3) {
      ctx.fillStyle = 'rgba(255, 93, 0, 0.35)';
      ctx.beginPath(); ctx.arc(HEAD.x - 17, HEAD.y - 14, 13, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(HEAD.x + 17, HEAD.y - 14, 13, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffb703';
    } else {
      ctx.fillStyle = '#231f20';
    }
    ctx.beginPath(); ctx.arc(HEAD.x - 17, HEAD.y - 14, 8, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(HEAD.x + 17, HEAD.y - 14, 8, 0, Math.PI * 2); ctx.fill();

    // angry brows, tilted down toward the middle
    ctx.fillStyle = DARK;
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(HEAD.x + side * 17, HEAD.y - 30);
      ctx.rotate(side * -0.28);
      ctx.fillRect(-12, -3, 24, 6);
      ctx.restore();
    }
  }

  /** Small pineapple icon for the skill slot. */
  #drawPineappleIcon() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    // leaf crown
    ctx.fillStyle = '#4e9b47';
    for (const [dx, h] of [[-10, 13], [0, 18], [10, 13]]) {
      ctx.beginPath();
      ctx.moveTo(32 + dx - 5, 24);
      ctx.lineTo(32 + dx, 24 - h);
      ctx.lineTo(32 + dx + 5, 24);
      ctx.closePath();
      ctx.fill();
    }

    // body with crosshatch, clipped to the oval
    ctx.fillStyle = '#f2b63d';
    ctx.beginPath();
    ctx.ellipse(32, 41, 15, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(32, 41, 15, 18, 0, 0, Math.PI * 2);
    ctx.clip();
    ctx.strokeStyle = 'rgba(176, 116, 28, 0.55)';
    ctx.lineWidth = 2;
    for (let i = -3; i <= 3; i++) {
      ctx.beginPath(); ctx.moveTo(32 + i * 10 - 18, 59); ctx.lineTo(32 + i * 10 + 18, 23); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(32 + i * 10 + 18, 59); ctx.lineTo(32 + i * 10 - 18, 23); ctx.stroke();
    }
    ctx.restore();

    return canvas;
  }

  /** Small durian icon for the E skill slot. */
  #drawDurianIcon() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const cx = 32, cy = 34, rx = 15, ry = 18;

    // husk spikes around the perimeter, tips outward
    ctx.fillStyle = '#6f7d2e';
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const bx = cx + Math.cos(a) * rx;
      const by = cy + Math.sin(a) * ry;
      const tx = cx + Math.cos(a) * (rx + 7);
      const ty = cy + Math.sin(a) * (ry + 7);
      const px = -Math.sin(a) * 3.5, py = Math.cos(a) * 3.5;
      ctx.beginPath();
      ctx.moveTo(bx + px, by + py);
      ctx.lineTo(tx, ty);
      ctx.lineTo(bx - px, by - py);
      ctx.closePath();
      ctx.fill();
    }

    // body
    ctx.fillStyle = '#9aa53f';
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(111, 125, 46, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx - 8, cy - 10); ctx.lineTo(cx + 4, cy + 10); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + 2, cy - 12); ctx.lineTo(cx + 10, cy + 4); ctx.stroke();

    return canvas;
  }

  /** Small aloe vera icon for the R skill slot: a rosette of thick pointed leaves. */
  #drawAloeIcon() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    // back leaves (darker, leaning out)
    for (const [dx, tilt, h] of [[-16, -0.7, 26], [16, 0.7, 26], [-8, -0.35, 32], [8, 0.35, 32]]) {
      ctx.save();
      ctx.translate(32 + dx, 54);
      ctx.rotate(tilt);
      ctx.fillStyle = '#5da75d';
      ctx.beginPath();
      ctx.moveTo(-6, 0);
      ctx.lineTo(0, -h);
      ctx.lineTo(6, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    // front center leaf (lightest)
    ctx.save();
    ctx.translate(32, 56);
    ctx.fillStyle = '#8fce8f';
    ctx.beginPath();
    ctx.moveTo(-7, 0);
    ctx.lineTo(0, -36);
    ctx.lineTo(7, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    return canvas;
  }
}
