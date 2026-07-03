/*
 * platform.js — Thin storage + environment shim.
 *
 * The same UI runs inside an Electron renderer (has localStorage) and inside a
 * Chrome extension page (should prefer chrome.storage.local so settings sync
 * across new-tab / popup / side-panel instances). This module hides that
 * difference behind a tiny async get/set.
 */
(function (root) {
  const KEY = 'worldclock.settings.v1';

  const hasChromeStorage =
    typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;
  const isElectron =
    typeof navigator !== 'undefined' && /Electron/i.test(navigator.userAgent);

  async function load() {
    try {
      if (hasChromeStorage) {
        const obj = await chrome.storage.local.get(KEY);
        return obj[KEY] || null;
      }
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.warn('[worldclock] settings load failed', e);
      return null;
    }
  }

  async function save(settings) {
    try {
      if (hasChromeStorage) {
        await chrome.storage.local.set({ [KEY]: settings });
      } else {
        localStorage.setItem(KEY, JSON.stringify(settings));
      }
    } catch (e) {
      console.warn('[worldclock] settings save failed', e);
    }
  }

  const api = {
    isElectron,
    isExtension: hasChromeStorage,
    load,
    save,
    // The Electron preload (if present) exposes window.desktop for native bits.
    desktop: (typeof window !== 'undefined' && window.desktop) || null,
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Platform = api;
})(typeof window !== 'undefined' ? window : globalThis);
