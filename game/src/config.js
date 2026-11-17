'use strict';
globalThis.Tideglass = {};
Tideglass.config = Object.freeze({
  width: 1200, height: 760, step: 1 / 120,
  arena: { x: 32, y: 112, w: 860, h: 574 },
  colors: { ink: '#071d28', deep: '#0a2632', teal: '#60ead5', gold: '#ffd083', coral: '#ff796d', white: '#f4efdc', muted: '#8aafb5', line: '#254651' },
  speed: 285, weaveSpeed: 210, threadLength: 1400, duration: 150,
  lanternQuota: 12, target: 36,
  blessings: [
    [
      { name: 'Gossamer sail', tag: 'AGILITY', description: 'Weave 25% faster.', detail: 'Draw tighter loops before hunters close in.', icon: 'sail', key: 'speed' },
      { name: 'Deep spool', tag: 'REACH', description: 'Carry 40% more silk.', detail: 'Enclose entire shoals in one sweeping loop.', icon: 'spool', key: 'silk' },
    ],
    [
      { name: 'Riptide drive', tag: 'OFFENSE', description: 'Dash recharges twice as fast.', detail: 'Cut through hunters. Keep the sea clear.', icon: 'drive', key: 'dash' },
      { name: 'Pearl armor', tag: 'SURVIVAL', description: 'Gain two hull points, fully repaired.', detail: 'Room to risk a bigger, more valuable catch.', icon: 'armor', key: 'hull' },
    ],
  ],
  lanterns: [{ x: 248, y: 300, name: 'The Shoal' }, { x: 678, y: 300, name: 'The Reef' }, { x: 462, y: 548, name: 'The Deep' }],
});
