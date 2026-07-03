/*
 * gen-icon.mjs — Generate the app icon with zero image dependencies.
 * Draws a dark-glass rounded-square clock and writes:
 *   assets/icon.png        (256x256, for Electron window/tray + docs)
 *   assets/icon.ico        (PNG-embedded ICO, for the Windows installer)
 *   assets/icon-128.png    (extension icon)
 *   assets/icon-48.png
 *   assets/icon-16.png
 * Run: node assets/gen-icon.mjs
 */
import { deflateSync } from 'zlib';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const here = dirname(fileURLToPath(import.meta.url));

// ── Render an RGBA buffer for a given size ──────────────────────
function render(S) {
  const buf = Buffer.alloc(S * S * 4);
  const set = (x, y, r, g, b, a) => {
    const i = (y * S + x) * 4;
    // alpha-over composite onto existing pixel
    const sa = a / 255, da = buf[i + 3] / 255, oa = sa + da * (1 - sa);
    if (oa === 0) return;
    buf[i]     = Math.round((r * sa + buf[i]     * da * (1 - sa)) / oa);
    buf[i + 1] = Math.round((g * sa + buf[i + 1] * da * (1 - sa)) / oa);
    buf[i + 2] = Math.round((b * sa + buf[i + 2] * da * (1 - sa)) / oa);
    buf[i + 3] = Math.round(oa * 255);
  };

  const cx = S / 2, cy = S / 2;
  const radius = S * 0.30;          // clock face radius
  const rr = S * 0.22;              // rounded-square corner radius
  const pad = S * 0.06;

  // Rounded-square background with a vertical navy->blue gradient.
  const rounded = (x, y) => {
    const minX = pad, maxX = S - pad, minY = pad, maxY = S - pad;
    if (x < minX || x > maxX || y < minY || y > maxY) return false;
    const dx = Math.max(minX + rr - x, 0, x - (maxX - rr));
    const dy = Math.max(minY + rr - y, 0, y - (maxY - rr));
    return dx * dx + dy * dy <= rr * rr;
  };

  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      if (!rounded(x, y)) continue;
      const t = y / S;
      const r = Math.round(18 + t * 8);
      const g = Math.round(28 + t * 20);
      const b = Math.round(52 + t * 40);
      set(x, y, r, g, b, 255);
    }
  }

  // Clock face: subtle lighter disc.
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const d = Math.hypot(x - cx, y - cy);
      if (d <= radius) {
        const a = 40; set(x, y, 255, 255, 255, a);
      }
      // ring
      const ring = Math.abs(d - radius);
      if (ring < S * 0.018) {
        const a = Math.round(255 * (1 - ring / (S * 0.018)));
        set(x, y, 96, 165, 250, a); // accent blue ring
      }
    }
  }

  // Hour ticks (12 marks).
  for (let k = 0; k < 12; k++) {
    const ang = (k / 12) * Math.PI * 2 - Math.PI / 2;
    const r1 = radius * 0.80, r2 = radius * 0.92;
    for (let r = r1; r <= r2; r += 0.5) {
      const x = Math.round(cx + Math.cos(ang) * r);
      const y = Math.round(cy + Math.sin(ang) * r);
      set(x, y, 255, 255, 255, 200);
      set(x + 1, y, 255, 255, 255, 120);
    }
  }

  // Hands: draw a thick line from center at an angle.
  const hand = (angleDeg, len, half, cr, cg, cb) => {
    const ang = (angleDeg - 90) * Math.PI / 180;
    const ex = cx + Math.cos(ang) * len, ey = cy + Math.sin(ang) * len;
    const steps = Math.ceil(len * 2);
    for (let s = 0; s <= steps; s++) {
      const px = cx + (ex - cx) * (s / steps);
      const py = cy + (ey - cy) * (s / steps);
      for (let ox = -half; ox <= half; ox++)
        for (let oy = -half; oy <= half; oy++)
          if (ox * ox + oy * oy <= half * half)
            set(Math.round(px + ox), Math.round(py + oy), cr, cg, cb, 255);
    }
  };
  hand(300, radius * 0.5, Math.max(1, S * 0.016), 255, 255, 255); // hour -> 10
  hand(60,  radius * 0.72, Math.max(1, S * 0.012), 96, 165, 250); // minute -> 2

  // Center hub.
  for (let y = 0; y < S; y++)
    for (let x = 0; x < S; x++)
      if (Math.hypot(x - cx, y - cy) <= S * 0.022) set(x, y, 255, 255, 255, 255);

  return buf;
}

// ── PNG encoder ─────────────────────────────────────────────────
function crc32(buf) {
  let c, crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crc]);
}
function encodePNG(S, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(S, 0); ihdr.writeUInt32BE(S, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8-bit, RGBA
  // filtered raw: prepend filter byte 0 per row
  const raw = Buffer.alloc((S * 4 + 1) * S);
  for (let y = 0; y < S; y++) {
    raw[y * (S * 4 + 1)] = 0;
    rgba.copy(raw, y * (S * 4 + 1) + 1, y * S * 4, (y + 1) * S * 4);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

// ── ICO (single PNG-compressed entry) ───────────────────────────
function encodeICO(pngBuf, S) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(1, 4);
  const dir = Buffer.alloc(16);
  dir[0] = S >= 256 ? 0 : S; dir[1] = S >= 256 ? 0 : S;
  dir[2] = 0; dir[3] = 0;
  dir.writeUInt16LE(1, 4); dir.writeUInt16LE(32, 6);
  dir.writeUInt32LE(pngBuf.length, 8);
  dir.writeUInt32LE(6 + 16, 12);
  return Buffer.concat([header, dir, pngBuf]);
}

// ── Emit files ──────────────────────────────────────────────────
for (const S of [256, 128, 48, 16]) {
  const png = encodePNG(S, render(S));
  const name = S === 256 ? 'icon.png' : `icon-${S}.png`;
  writeFileSync(join(here, name), png);
  console.log(`✅ ${name} (${png.length} bytes)`);
}
const png256 = encodePNG(256, render(256));
writeFileSync(join(here, 'icon.ico'), encodeICO(png256, 256));
console.log('✅ icon.ico');
