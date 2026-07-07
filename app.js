/*
 * app.js — DOM rendering + interaction for the World Clock gadget.
 * Depends on: timezones.js (TZ), clock-core.js (ClockCore), platform.js (Platform).
 */
(function () {
  const $ = (sel) => document.querySelector(sel);
  const ANCHOR_ID = 'seoul';
  const WD_KO = ['일', '월', '화', '수', '목', '금', '토'];
  const MONTH_NUM = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 };

  // Windows can't render regional-indicator flag emoji (they show as "KR"),
  // so we render a real SVG flag image and keep the 2-letter code as a fallback.
  function flagToCode(flag) {
    const cp = [...String(flag)].map((c) => c.codePointAt(0));
    if (cp.length >= 2 && cp[0] >= 0x1f1e6 && cp[0] <= 0x1f1ff) {
      return String.fromCharCode(cp[0] - 0x1f1e6 + 65) + String.fromCharCode(cp[1] - 0x1f1e6 + 65);
    }
    return String(flag).slice(0, 2).toUpperCase();
  }
  // Bundled local SVG flags (no external requests — works offline & behind firewalls).
  // Falls back to the 2-letter code text when there's no flag (e.g. UTC) or it fails to load.
  function flagSrc(flag) {
    const code = flagToCode(flag).toLowerCase();
    return /^[a-z]{2}$/.test(code) ? `flags/${code}.svg` : '';
  }
  function wireFlag(imgEl) {
    if (!imgEl) return;
    if (!imgEl.getAttribute('src')) { imgEl.style.display = 'none'; return; }
    imgEl.addEventListener('error', () => { imgEl.style.display = 'none'; }, { once: true });
  }

  // ── State ────────────────────────────────────────────────────
  const DEFAULT_STATE = {
    cities: ['seoul', 'newyork', 'sanfrancisco', 'paris'], // Seoul anchor + user defaults
    format: '24',        // '24' | '12'
    showSeconds: false,
    opacity: 100,
    alwaysTop: true,
    autostart: false,
  };
  let state = { ...DEFAULT_STATE };
  let sliderOffsetMin = 0;   // minutes offset from "now" chosen on the planner slider
  let tickTimer = null;

  // ── Persistence ─────────────────────────────────────────────
  async function loadState() {
    const saved = await Platform.load();
    if (saved) state = { ...DEFAULT_STATE, ...saved };
    // Seoul must always be present and first (it's the reference anchor).
    state.cities = state.cities.filter((id) => TZ.getById(id));
    state.cities = [ANCHOR_ID, ...state.cities.filter((id) => id !== ANCHOR_ID)];
    if (state.cities.length === 1) {
      state.cities = [...DEFAULT_STATE.cities];
    }
  }
  const saveState = () => Platform.save(state);

  // ── Time helpers ─────────────────────────────────────────────
  function baseDate() {
    // Live "now" shifted by the planner slider (slider drives all cards at once).
    return new Date(Date.now() + sliderOffsetMin * 60000);
  }

  function formatTime(hour, minute, second) {
    const mm = String(minute).padStart(2, '0');
    const ss = String(second).padStart(2, '0');
    if (state.format === '12') {
      const ampm = hour < 12 ? 'AM' : 'PM';
      let h = hour % 12; if (h === 0) h = 12;
      return { main: `${h}:${mm}`, sec: state.showSeconds ? ss : '', ampm };
    }
    return { main: `${String(hour).padStart(2, '0')}:${mm}`, sec: state.showSeconds ? ss : '', ampm: '' };
  }

  // ── Card rendering ───────────────────────────────────────────
  const clocksEl = $('#clocks');

  function buildCard(city) {
    const el = document.createElement('div');
    el.className = 'card';
    el.dataset.id = city.id;
    el.draggable = true;
    el.innerHTML = `
      <div class="card__avatar">
        <img class="card__flagimg" src="${flagSrc(city.flag)}" alt="">
        <span class="card__code">${flagToCode(city.flag)}</span>
        <i class="card__status"></i>
      </div>
      <div class="card__info">
        <div class="card__city"><span class="card__name"></span></div>
        <div class="card__meta">
          <span class="card__glyph"></span>
          <span class="card__offset"></span>
        </div>
      </div>
      <div class="card__right">
        <div class="card__time"></div>
        <div class="card__date"></div>
      </div>
      <button class="card__remove" title="삭제">✕</button>
    `;
    const nameEl = el.querySelector('.card__name');
    nameEl.textContent = `${city.cityKo} · ${city.countryKo}`;
    wireFlag(el.querySelector('.card__flagimg'));

    const removeBtn = el.querySelector('.card__remove');
    if (removeBtn) removeBtn.addEventListener('click', (e) => { e.stopPropagation(); removeCity(city.id); });

    attachDrag(el);
    return el;
  }

  // The anchor (Seoul) lives in the hero, so the list shows every other city.
  function listCities() {
    return state.cities.filter((id) => id !== ANCHOR_ID);
  }

  function renderCards() {
    clocksEl.innerHTML = '';
    const ids = listCities();
    if (ids.length === 0) {
      clocksEl.innerHTML = '<div class="empty">＋ 버튼으로 도시를 추가해 보세요.</div>';
      return;
    }
    for (const id of ids) {
      const city = TZ.getById(id);
      if (city) clocksEl.appendChild(buildCard(city));
    }
    updateCards();
  }

  // Format a compact time payload into card/hero HTML.
  function timeHTML(t) {
    return `${t.main}` +
      (t.sec ? `<span class="sec">:${t.sec}</span>` : '') +
      (t.ampm ? `<span class="ampm">${t.ampm}</span>` : '');
  }

  // The hero shows the anchor (Korea / KST) large.
  function updateHero(now) {
    const city = TZ.getById(ANCHOR_ID);
    const p = ClockCore.getParts(city.tz, now);
    const wd = ClockCore.weekdayIndex(city.tz, now);
    $('#heroTime').innerHTML = timeHTML(formatTime(p.hour, p.minute, p.second));
    $('#heroDate').textContent =
      `${MONTH_NUM[p.month] || p.month}월 ${parseInt(p.day, 10)}일 (${WD_KO[wd]}) · ` +
      (ClockCore.isDaytime(p.hour) ? '☀️ 낮' : '🌙 밤');
  }

  // Refresh the live values on every card (called each tick + on slider move).
  function updateCards() {
    const now = baseDate();
    const anchorDayKey = dayKey(ClockCore.ANCHOR_TZ, now);
    updateHero(now);

    for (const el of clocksEl.querySelectorAll('.card')) {
      const city = TZ.getById(el.dataset.id);
      if (!city) continue;
      const p = ClockCore.getParts(city.tz, now);
      const wd = ClockCore.weekdayIndex(city.tz, now);
      const isWeekend = wd === 0 || wd === 6;
      const st = ClockCore.businessState(p.hour, { isWeekend });

      // business-hours status dot
      el.classList.remove('state-work', 'state-edge', 'state-off');
      el.classList.add('state-' + st);

      // time
      el.querySelector('.card__time').innerHTML = timeHTML(formatTime(p.hour, p.minute, p.second));

      // date + day-diff marker (relative to Korea's calendar day)
      const dayCls = dayKey(city.tz, now) !== anchorDayKey ? ' class="nextday"' : '';
      el.querySelector('.card__date').innerHTML =
        `<span${dayCls}>${MONTH_NUM[p.month] || p.month}월 ${parseInt(p.day, 10)}일 (${WD_KO[wd]})</span>`;

      // offset vs Korea
      const offEl = el.querySelector('.card__offset');
      offEl.textContent = ClockCore.formatOffsetVsAnchor(city.tz, now);
      const offMin = ClockCore.offsetVsAnchorMinutes(city.tz, now);
      offEl.classList.toggle('ahead', offMin > 0);
      offEl.classList.toggle('behind', offMin < 0);

      // day/night glyph
      el.querySelector('.card__glyph').textContent = ClockCore.isDaytime(p.hour) ? '☀️' : '🌙';
    }
  }

  // A calendar-day identifier in a tz, for detecting date differences.
  function dayKey(tz, date) {
    const p = ClockCore.getParts(tz, date);
    return `${p.year}-${p.month}-${p.day}`;
  }

  // ── Add / remove / reorder ───────────────────────────────────
  function addCity(id) {
    if (state.cities.includes(id)) return;
    state.cities.push(id);
    saveState();
    renderCards();
  }
  function removeCity(id) {
    if (id === ANCHOR_ID) return; // anchor is permanent
    state.cities = state.cities.filter((c) => c !== id);
    saveState();
    renderCards();
  }

  // HTML5 drag-and-drop reordering (Seoul anchor stays put at index 0).
  let dragId = null;
  function attachDrag(el) {
    el.addEventListener('dragstart', (e) => {
      dragId = el.dataset.id;
      el.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });
    el.addEventListener('dragend', () => {
      el.classList.remove('dragging');
      clocksEl.querySelectorAll('.drop-target').forEach((c) => c.classList.remove('drop-target'));
      dragId = null;
    });
    el.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (el.dataset.id !== dragId) el.classList.add('drop-target');
    });
    el.addEventListener('dragleave', () => el.classList.remove('drop-target'));
    el.addEventListener('drop', (e) => {
      e.preventDefault();
      el.classList.remove('drop-target');
      const targetId = el.dataset.id;
      if (!dragId || dragId === targetId || targetId === ANCHOR_ID) return;
      const from = state.cities.indexOf(dragId);
      const to = state.cities.indexOf(targetId);
      if (from < 0 || to < 0) return;
      state.cities.splice(from, 1);
      state.cities.splice(to, 0, dragId);
      saveState();
      renderCards();
    });
  }

  // ── Planner slider ───────────────────────────────────────────
  const slider = $('#slider');
  const plannerTime = $('#plannerTime');
  function onSlider() {
    sliderOffsetMin = parseInt(slider.value, 10);
    updatePlannerLabel();
    updateCards();
  }
  function updatePlannerLabel() {
    const now = baseDate();
    const ap = ClockCore.getParts(ClockCore.ANCHOR_TZ, now);
    const t = formatTime(ap.hour, ap.minute, 0);
    if (sliderOffsetMin === 0) {
      plannerTime.textContent = '한국 시간 기준 회의 시각';
      plannerTime.classList.remove('shifted');
    } else {
      const sign = sliderOffsetMin > 0 ? '+' : '−';
      const abs = Math.abs(sliderOffsetMin);
      const label = `${sign}${Math.floor(abs / 60)}h${abs % 60 ? (abs % 60) + 'm' : ''}`;
      plannerTime.textContent = `한국 ${t.main}${t.ampm ? ' ' + t.ampm : ''} (${label})`;
      plannerTime.classList.add('shifted');
    }
  }
  function resetNow() {
    sliderOffsetMin = 0;
    slider.value = 0;
    updatePlannerLabel();
    updateCards();
  }

  // ── Add-city modal ───────────────────────────────────────────
  const addModal = $('#addModal');
  const searchInput = $('#searchInput');
  const searchResults = $('#searchResults');

  function openAdd() {
    addModal.hidden = false;
    searchInput.value = '';
    renderResults('');
    setTimeout(() => searchInput.focus(), 30);
  }
  function renderResults(query) {
    const now = new Date();
    const list = TZ.search(query).filter((c) => c.id !== ANCHOR_ID);
    if (list.length === 0) {
      searchResults.innerHTML = '<li class="results__empty">검색 결과가 없습니다.</li>';
      return;
    }
    searchResults.innerHTML = '';
    for (const c of list.slice(0, 60)) {
      const li = document.createElement('li');
      const added = state.cities.includes(c.id);
      li.className = 'result' + (added ? ' result--added' : '');
      li.innerHTML = `
        <span class="result__flag">
          <img class="result__flagimg" src="${flagSrc(c.flag)}" alt="">
          <span class="result__code">${flagToCode(c.flag)}</span>
        </span>
        <span class="result__text">
          <div class="result__city">${c.cityKo}<span class="en">${c.city}</span></div>
          <div class="result__country">${c.countryKo}</div>
        </span>
        <span class="result__off">${ClockCore.formatOffsetVsAnchor(c.tz, now)}</span>`;
      wireFlag(li.querySelector('.result__flagimg'));
      if (!added) li.addEventListener('click', () => { addCity(c.id); addModal.hidden = true; });
      searchResults.appendChild(li);
    }
  }

  // ── Settings modal ───────────────────────────────────────────
  const settingsModal = $('#settingsModal');
  function openSettings() {
    $('#setFormat').value = state.format;
    $('#setSeconds').checked = state.showSeconds;
    $('#setOpacity').value = state.opacity;
    $('#setAlwaysTop').checked = state.alwaysTop;
    $('#setAutostart').checked = state.autostart;
    settingsModal.hidden = false;
  }

  function applyFormat() {
    $('#btnFormat').textContent = state.format === '24' ? '24h' : '12h';
  }

  // ── Electron desktop integration (optional) ─────────────────
  function setupDesktop() {
    const d = Platform.desktop;
    if (!d) return; // running as extension / plain web page
    document.body.classList.add('is-desktop');
    $('#winControls').hidden = false;
    $('#rowAutostart').hidden = false;
    $('#rowAlwaysTop').hidden = false;

    $('#btnMin').addEventListener('click', () => d.minimize());
    $('#btnClose').addEventListener('click', () => d.hide());
    $('#btnPin').addEventListener('click', () => {
      state.alwaysTop = !state.alwaysTop;
      d.setAlwaysOnTop(state.alwaysTop);
      $('#btnPin').classList.toggle('active', state.alwaysTop);
      saveState();
    });

    // Apply persisted desktop prefs on launch.
    d.setAlwaysOnTop(state.alwaysTop);
    d.setOpacity(state.opacity / 100);
    $('#btnPin').classList.toggle('active', state.alwaysTop);

    $('#setOpacity').addEventListener('input', (e) => {
      state.opacity = parseInt(e.target.value, 10);
      d.setOpacity(state.opacity / 100);
      saveState();
    });
    $('#setAlwaysTop').addEventListener('change', (e) => {
      state.alwaysTop = e.target.checked;
      d.setAlwaysOnTop(state.alwaysTop);
      $('#btnPin').classList.toggle('active', state.alwaysTop);
      saveState();
    });
    $('#setAutostart').addEventListener('change', (e) => {
      state.autostart = e.target.checked;
      d.setAutostart(state.autostart);
      saveState();
    });
  }

  // ── Wiring ───────────────────────────────────────────────────
  function bindEvents() {
    $('#btnFormat').addEventListener('click', () => {
      state.format = state.format === '24' ? '12' : '24';
      applyFormat(); saveState(); updateCards(); updatePlannerLabel();
    });
    $('#btnAdd').addEventListener('click', openAdd);
    $('#btnSettings').addEventListener('click', openSettings);
    $('#btnNow').addEventListener('click', resetNow);
    slider.addEventListener('input', onSlider);

    searchInput.addEventListener('input', (e) => renderResults(e.target.value));
    searchInput.addEventListener('keydown', (e) => { if (e.key === 'Escape') addModal.hidden = true; });

    // Settings live-bind (non-desktop parts)
    $('#setFormat').addEventListener('change', (e) => {
      state.format = e.target.value; applyFormat(); saveState(); updateCards(); updatePlannerLabel();
    });
    $('#setSeconds').addEventListener('change', (e) => {
      state.showSeconds = e.target.checked; saveState(); updateCards();
    });

    // Modal close (backdrop / ✕ / Esc)
    document.querySelectorAll('[data-close]').forEach((el) =>
      el.addEventListener('click', () => { addModal.hidden = true; settingsModal.hidden = true; }));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { addModal.hidden = true; settingsModal.hidden = true; }
    });
  }

  // ── Boot ─────────────────────────────────────────────────────
  async function init() {
    // Plain browser tab / extension new-tab gets a solid backdrop.
    if (!Platform.isElectron) document.body.classList.add('standalone');

    await loadState();

    // Fill in the anchor (hero) identity once.
    const anchor = TZ.getById(ANCHOR_ID);
    if (anchor) {
      $('#heroCity').textContent = anchor.cityKo;
      $('#heroCountry').textContent = anchor.countryKo;
      $('#heroCode').textContent = flagToCode(anchor.flag);
      const heroFlag = $('#heroFlag');
      heroFlag.src = flagSrc(anchor.flag);
      wireFlag(heroFlag);
    }

    applyFormat();
    bindEvents();
    setupDesktop();
    renderCards();
    updatePlannerLabel();

    // One shared ticking timer. When the slider is on "now", keep ticking live.
    tickTimer = setInterval(() => {
      if (sliderOffsetMin === 0) updateCards();
    }, 1000);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
