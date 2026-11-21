// Placeholder character roster — the actual character art/models are being
// built by another dev; swap these entries when the real ones are ready.
// Level n costs n*5 pellets to leave; level 10 is the cap (xpToNext: null).
export const CHARACTERS = [
  { level: 1, name: 'Worm', xpToNext: 5, colors: [0xe5989b, 0xd97f86] },
  { level: 2, name: 'Grub', xpToNext: 10, colors: [0xf0e6c8, 0xd8c9a0] },
  { level: 3, name: 'Caterpillar', xpToNext: 15, colors: [0x9ecf6e, 0x7fb355] },
  { level: 4, name: 'Chrysalis', xpToNext: 20, colors: [0xd8b26a, 0xb8934a] },
  { level: 5, name: 'Beetle', xpToNext: 25, colors: [0x7a6fd0, 0x5f55b3] },
  { level: 6, name: 'Moth', xpToNext: 30, colors: [0xc9a2d8, 0xa87fbd] },
  { level: 7, name: 'Dragonfly', xpToNext: 35, colors: [0x6fc3cf, 0x54a3b3] },
  { level: 8, name: 'Newt', xpToNext: 40, colors: [0xf0a05a, 0xd1813f] },
  { level: 9, name: 'Serpent', xpToNext: 45, colors: [0x86b06a, 0x679150] },
  { level: 10, name: 'Dragon', xpToNext: null, colors: [0xd05f5f, 0xb34545] },
];

export const MAX_LEVEL = CHARACTERS.length;
