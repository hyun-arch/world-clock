/*
 * clock-core.js — Pure, DOM-free time logic. Safe to unit-test in Node.
 *
 * All timezone math is derived at runtime from IANA ids through Intl, so
 * Daylight Saving Time is handled automatically and stays correct over the
 * years (no hardcoded UTC offsets anywhere).
 */
(function (root) {
  const ANCHOR_TZ = 'Asia/Seoul'; // Korea is the reference the user judges against.

  // Cache formatters per (tz + shape); constructing Intl.DateTimeFormat is costly.
  const _fmtCache = {};
  function fmt(tz, opts) {
    const key = tz + '|' + JSON.stringify(opts);
    return _fmtCache[key] || (_fmtCache[key] = new Intl.DateTimeFormat('en-US', { timeZone: tz, ...opts }));
  }

  /**
   * The wall-clock offset (in minutes) of `tz` relative to UTC at instant `date`.
   * Uses the 'en-US' formatToParts trick: format the same instant in the target
   * zone, rebuild it as if it were UTC, and diff. DST-correct by construction.
   */
  function tzOffsetMinutes(tz, date) {
    const parts = fmt(tz, {
      year: 'numeric', month: 'numeric', day: 'numeric',
      hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false,
    }).formatToParts(date);
    const map = {};
    for (const p of parts) if (p.type !== 'literal') map[p.type] = parseInt(p.value, 10);
    // hour '24' can appear for midnight in some engines; normalize to 0.
    const hour = map.hour === 24 ? 0 : map.hour;
    const asUTC = Date.UTC(map.year, map.month - 1, map.day, hour, map.minute, map.second);
    return Math.round((asUTC - date.getTime()) / 60000);
  }

  /**
   * Difference of `tz` vs the anchor (Korea), in minutes, at instant `date`.
   * Positive => `tz` is ahead of Korea; negative => behind.
   */
  function offsetVsAnchorMinutes(tz, date, anchorTz) {
    const d = date || new Date();
    return tzOffsetMinutes(tz, d) - tzOffsetMinutes(anchorTz || ANCHOR_TZ, d);
  }

  /** "KST +1h" / "KST −14h" / "KST −8:30" / "KST 기준" for the anchor itself. */
  function formatOffsetVsAnchor(tz, date, anchorTz) {
    const mins = offsetVsAnchorMinutes(tz, date, anchorTz);
    if (mins === 0) return 'KST 기준';
    const sign = mins > 0 ? '+' : '−';
    const abs = Math.abs(mins);
    const h = Math.floor(abs / 60);
    const m = abs % 60;
    return m === 0 ? `KST ${sign}${h}h` : `KST ${sign}${h}:${String(m).padStart(2, '0')}`;
  }

  /**
   * Decomposed wall-clock parts for `tz` at instant `date`.
   * hour is 0-23; the UI applies 12/24h formatting.
   */
  function getParts(tz, date) {
    const d = date || new Date();
    const p = {};
    for (const part of fmt(tz, {
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      weekday: 'short', year: 'numeric', month: 'short', day: '2-digit',
      hour12: false,
    }).formatToParts(d)) {
      if (part.type !== 'literal') p[part.type] = part.value;
    }
    let hour = parseInt(p.hour, 10);
    if (hour === 24) hour = 0;
    return {
      hour,
      minute: parseInt(p.minute, 10),
      second: parseInt(p.second, 10),
      weekday: p.weekday,      // e.g. "Mon"
      day: p.day,              // "07"
      month: p.month,          // "Jul"
      year: p.year,            // "2026"
    };
  }

  /** Weekday index 0=Sun..6=Sat for `tz` at `date` (for weekend detection). */
  function weekdayIndex(tz, date) {
    const wd = fmt(tz, { weekday: 'short' }).format(date || new Date());
    return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(wd);
  }

  /**
   * Business-hours classification for a given local hour.
   *   work : 9–18  (comfortable to call — green)
   *   edge : 7–9 / 18–21 (borderline — amber)
   *   off  : otherwise (night — grey)
   * Weekends downgrade work->edge to signal "working, but it's the weekend".
   */
  function businessState(hour, opts) {
    const o = opts || {};
    const workStart = o.workStart ?? 9;
    const workEnd = o.workEnd ?? 18;
    const edgeStart = o.edgeStart ?? 7;
    const edgeEnd = o.edgeEnd ?? 21;
    const isWeekend = !!o.isWeekend;

    let state;
    if (hour >= workStart && hour < workEnd) state = 'work';
    else if (hour >= edgeStart && hour < edgeEnd) state = 'edge';
    else state = 'off';

    if (isWeekend && state === 'work') state = 'edge';
    return state;
  }

  /** Simple day/night flag for the sun/moon glyph (day = 6:00–18:59). */
  function isDaytime(hour) {
    return hour >= 6 && hour < 19;
  }

  const api = {
    ANCHOR_TZ,
    tzOffsetMinutes,
    offsetVsAnchorMinutes,
    formatOffsetVsAnchor,
    getParts,
    weekdayIndex,
    businessState,
    isDaytime,
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ClockCore = api;
})(typeof window !== 'undefined' ? window : globalThis);
