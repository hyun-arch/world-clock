/*
 * sync.mjs — Copy the canonical shared/ UI into the two wrappers so each is
 * self-contained (Chrome extensions and packaged Electron apps can only load
 * files inside their own root).
 *
 * Run: node build/sync.mjs
 */
import { cpSync, rmSync, mkdirSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'shared');
const assets = join(root, 'assets');

const targets = [
  join(root, 'chrome-extension', 'shared'),
  join(root, 'electron', 'shared'),
];

// Extension icons must live inside the extension root; copy them alongside the UI.
const iconFiles = ['icon-16.png', 'icon-48.png', 'icon-128.png', 'icon.png'];

for (const dest of targets) {
  if (existsSync(dest)) rmSync(dest, { recursive: true, force: true });
  mkdirSync(dest, { recursive: true });
  cpSync(src, dest, { recursive: true });
  for (const f of iconFiles) {
    const from = join(assets, f);
    if (existsSync(from)) cpSync(from, join(dest, f));
  }
  console.log(`✅ synced shared/ (+icons) -> ${dest.replace(root, '.')}`);
}
console.log('Done. Reload the extension / repackage Electron to pick up changes.');
