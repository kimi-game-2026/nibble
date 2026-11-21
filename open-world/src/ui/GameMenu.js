export class GameMenu {
  constructor() {
    this.overlay = document.getElementById('overlay');
    this.eyebrow = document.getElementById('menu-eyebrow');
    this.title = document.getElementById('menu-title');
    this.tagline = document.getElementById('menu-tagline');
    this.status = document.getElementById('menu-status');
    this.primaryButton = document.getElementById('primary-action');
    this.restartButton = document.getElementById('restart-action');
    this.primaryCb = null;
    this.restartCb = null;
    this.primaryButton.addEventListener('click', () => this.primaryCb?.());
    this.restartButton.addEventListener('click', () => this.restartCb?.());
  }

  onPrimary(cb) {
    this.primaryCb = cb;
  }

  onRestart(cb) {
    this.restartCb = cb;
  }

  showStart() {
    this.overlay.classList.remove('hidden', 'paused');
    this.eyebrow.textContent = 'A TINY SURVIVAL ADVENTURE';
    this.title.textContent = 'NIBBLE';
    this.tagline.textContent = 'Eat small. Grow mighty. Rule the wild.';
    this.status.textContent = 'The wild is hungry. So are you.';
    this.primaryButton.textContent = 'Start Nibbling';
    this.restartButton.hidden = true;
  }

  showPause(level, experience) {
    this.overlay.classList.remove('hidden');
    this.overlay.classList.add('paused');
    this.eyebrow.textContent = 'RUN PAUSED';
    this.title.textContent = 'CATCH YOUR BREATH';
    this.tagline.textContent = "The wild can wait. Your next bite can't.";
    this.status.textContent = `Level ${level} · ${experience} XP in the bank`;
    this.primaryButton.textContent = 'Keep Nibbling';
    this.restartButton.hidden = false;
  }

  hide() {
    this.overlay.classList.add('hidden');
  }
}
