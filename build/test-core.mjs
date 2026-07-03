/*
 * test-core.mjs — Node sanity checks for clock-core.js.
 * Run: node build/test-core.mjs
 * Verifies DST-correct offset-vs-Seoul and business-hours boundaries.
 */
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const Core = require('../shared/clock-core.js');

let pass = 0, fail = 0;
function eq(actual, expected, msg) {
  const ok = actual === expected;
  console.log(`${ok ? '✅' : '❌'} ${msg}  →  got ${JSON.stringify(actual)}${ok ? '' : `, expected ${JSON.stringify(expected)}`}`);
  ok ? pass++ : fail++;
}

// Seoul has no DST (fixed KST, UTC+9). Test both a summer and winter instant.
const summer = new Date('2026-07-15T03:00:00Z'); // NY/Paris/SF on DST
const winter = new Date('2026-01-15T03:00:00Z'); // standard time

// New York: summer EDT = UTC-4 -> vs KST(UTC+9) = -13h; winter EST = UTC-5 -> -14h
eq(Core.formatOffsetVsAnchor('America/New_York', summer), 'KST −13h', 'NY summer vs KST = −13h');
eq(Core.formatOffsetVsAnchor('America/New_York', winter), 'KST −14h', 'NY winter vs KST = −14h');

// San Francisco: summer PDT UTC-7 -> -16h; winter PST UTC-8 -> -17h
eq(Core.formatOffsetVsAnchor('America/Los_Angeles', summer), 'KST −16h', 'SF summer vs KST = −16h');
eq(Core.formatOffsetVsAnchor('America/Los_Angeles', winter), 'KST −17h', 'SF winter vs KST = −17h');

// Paris: summer CEST UTC+2 -> -7h; winter CET UTC+1 -> -8h
eq(Core.formatOffsetVsAnchor('Europe/Paris', summer), 'KST −7h', 'Paris summer vs KST = −7h');
eq(Core.formatOffsetVsAnchor('Europe/Paris', winter), 'KST −8h', 'Paris winter vs KST = −8h');

// India half-hour offset: IST UTC+5:30 -> vs KST -3:30
eq(Core.formatOffsetVsAnchor('Asia/Kolkata', summer), 'KST −3:30', 'Delhi vs KST = −3:30');

// Seoul itself is the reference
eq(Core.formatOffsetVsAnchor('Asia/Seoul', summer), 'KST 기준', 'Seoul is the anchor');

// Tokyo shares UTC+9 with Seoul -> 0 diff
eq(Core.formatOffsetVsAnchor('Asia/Tokyo', summer), 'KST 기준', 'Tokyo same as KST');

// Sydney summer(Jul=winter there, UTC+10) -> +1h; Jan(DST UTC+11) -> +2h
eq(Core.formatOffsetVsAnchor('Australia/Sydney', summer), 'KST +1h', 'Sydney Jul vs KST = +1h');
eq(Core.formatOffsetVsAnchor('Australia/Sydney', winter), 'KST +2h', 'Sydney Jan vs KST = +2h');

// Business-hours boundaries
eq(Core.businessState(9),  'work', 'hour 9 = work');
eq(Core.businessState(17), 'work', 'hour 17 = work');
eq(Core.businessState(18), 'edge', 'hour 18 = edge');
eq(Core.businessState(7),  'edge', 'hour 7 = edge');
eq(Core.businessState(6),  'off',  'hour 6 = off');
eq(Core.businessState(22), 'off',  'hour 22 = off');
eq(Core.businessState(10, { isWeekend: true }), 'edge', 'weekend workhour downgraded to edge');

// Day/night glyph
eq(Core.isDaytime(6),  true,  '06:00 is day');
eq(Core.isDaytime(19), false, '19:00 is night');

console.log(`\n${fail === 0 ? '🎉 ALL PASSED' : '⚠️  FAILURES'}: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
