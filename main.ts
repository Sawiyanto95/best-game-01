import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

// The hand-in is a fresh, deterministic copy of our offline game and browser captures.
const source = fileURLToPath(new URL('.', import.meta.url));
const output = resolve(process.env.MAKEFUN_OUTPUT_DIR ?? '/output');
if (output === resolve(source)) throw new Error('Output must be separate from the entry source.');
mkdirSync(output, { recursive: true });
for (const folder of ['game', 'screenshots']) {
  rmSync(join(output, folder), { recursive: true, force: true });
  cpSync(join(source, folder), join(output, folder), { recursive: true });
}
writeFileSync(join(output, 'dossier.json'), buildDossier(output, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
}));
console.log('Tideglass: game, screenshots and dossier written.');
