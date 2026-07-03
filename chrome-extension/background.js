/*
 * background.js — MV3 service worker.
 * Makes the toolbar icon open the persistent side panel (gadget stays docked
 * beside the page) instead of a transient popup.
 */
chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((err) => console.warn('sidePanel behavior not set:', err));
});

// Also set it on startup so it survives service-worker restarts.
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch(() => {});
