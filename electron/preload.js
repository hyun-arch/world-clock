/*
 * preload.js — Safe bridge between the renderer (shared UI) and Electron main.
 * Exposes a minimal, allow-listed `window.desktop` API. No Node access leaks
 * into the page (contextIsolation is on).
 */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktop', {
  minimize: () => ipcRenderer.send('win:minimize'),
  hide: () => ipcRenderer.send('win:hide'),
  setAlwaysOnTop: (on) => ipcRenderer.send('win:alwaysOnTop', on),
  setOpacity: (value) => ipcRenderer.send('win:opacity', value),
  setAutostart: (on) => ipcRenderer.send('app:autostart', on),
  getAutostart: () => ipcRenderer.invoke('app:getAutostart'),
});
