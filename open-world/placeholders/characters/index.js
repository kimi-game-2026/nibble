// Placeholder character roster — the actual character art/models are being
// built by another dev; swap these entries when the real ones are ready.
// title: the individual's name shown in the HUD. The creature's appearance
// (colors, spikes, horns) comes from the shared CreatureModel per level.
// Level n costs n*5 pellets to leave; level 10 is the cap (xpToNext: null).
export const CHARACTERS = [
  { level: 1, name: 'Worm', title: 'Wiggly', xpToNext: 5 },
  { level: 2, name: 'Grub', title: 'Chomper', xpToNext: 10 },
  { level: 3, name: 'Caterpillar', title: 'Munchkin', xpToNext: 15 },
  { level: 4, name: 'Chrysalis', title: 'Dozer', xpToNext: 20 },
  { level: 5, name: 'Beetle', title: 'Scuttles', xpToNext: 25 },
  { level: 6, name: 'Moth', title: 'Flutters', xpToNext: 30 },
  { level: 7, name: 'Dragonfly', title: 'Zoomer', xpToNext: 35 },
  { level: 8, name: 'Newt', title: 'Slick', xpToNext: 40 },
  { level: 9, name: 'Serpent', title: 'Slither', xpToNext: 45 },
  { level: 10, name: 'Dragon', title: 'Blaze', xpToNext: null },
];

export const MAX_LEVEL = CHARACTERS.length;
