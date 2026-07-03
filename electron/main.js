/*
 * main.js — Electron main process for the World Clock desktop gadget.
 *
 * Creates a frameless, transparent, always-on-top window that behaves like an
 * old Windows gadget: drag it anywhere, it floats over other apps, it can hide
 * to the tray, and it can auto-launch at Windows login.
 */
const { app, BrowserWindow, Tray, Menu, ipcMain, screen, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');

// Persist window bounds (position/size) next to the app's userData.
const boundsFile = () => path.join(app.getPath('userData'), 'window-bounds.json');
function loadBounds() {
  try { return JSON.parse(fs.readFileSync(boundsFile(), 'utf8')); } catch { return null; }
}
function saveBounds(win) {
  try { fs.writeFileSync(boundsFile(), JSON.stringify(win.getBounds())); } catch {}
}

let win = null;
let tray = null;

function createWindow() {
  const saved = loadBounds();
  const { width: sw } = screen.getPrimaryDisplay().workAreaSize;

  win = new BrowserWindow({
    width: saved?.width || 360,
    height: saved?.height || 560,
    x: saved?.x ?? sw - 380,
    y: saved?.y ?? 40,
    minWidth: 300,
    minHeight: 260,
    frame: false,            // no OS title bar — we draw our own
    transparent: true,       // glassmorphism / rounded corners
    resizable: true,
    skipTaskbar: false,
    alwaysOnTop: true,
    fullscreenable: false,
    backgroundColor: '#00000000',
    icon: path.join(__dirname, '..', 'assets', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.setAlwaysOnTop(true, 'screen-saver'); // float above most windows

  // Load the shared UI (single source of truth). In development the canonical
  // copy lives at ../shared; when packaged, build/sync.mjs copies it to ./shared
  // so it ships inside the app bundle.
  const localShared = path.join(__dirname, 'shared', 'index.html');
  const devShared = path.join(__dirname, '..', 'shared', 'index.html');
  win.loadFile(fs.existsSync(localShared) ? localShared : devShared);

  // Persist bounds on move/resize (debounced-ish via close + moments).
  ['moved', 'resized'].forEach((ev) => win.on(ev, () => saveBounds(win)));
  win.on('close', () => saveBounds(win));

  // Closing the window hides to tray instead of quitting.
  win.on('close', (e) => {
    if (!app.isQuitting) { e.preventDefault(); win.hide(); }
  });
}

function createTray() {
  const iconPath = path.join(__dirname, '..', 'assets', 'icon.png');
  let image = nativeImage.createFromPath(iconPath);
  if (image.isEmpty()) image = nativeImage.createEmpty();
  tray = new Tray(image);
  tray.setToolTip('World Clock · 세계 시계');
  const menu = Menu.buildFromTemplate([
    { label: '열기 / 보이기', click: () => { win.show(); win.focus(); } },
    { label: '숨기기', click: () => win.hide() },
    { type: 'separator' },
    {
      label: 'Windows 시작 시 자동 실행',
      type: 'checkbox',
      checked: app.getLoginItemSettings().openAtLogin,
      click: (item) => app.setLoginItemSettings({ openAtLogin: item.checked }),
    },
    { type: 'separator' },
    { label: '종료', click: () => { app.isQuitting = true; app.quit(); } },
  ]);
  tray.setContextMenu(menu);
  tray.on('double-click', () => { win.show(); win.focus(); });
}

// ── IPC: renderer -> native controls (exposed via preload) ──────
ipcMain.on('win:minimize', () => win && win.minimize());
ipcMain.on('win:hide', () => win && win.hide());
ipcMain.on('win:alwaysOnTop', (_e, on) => win && win.setAlwaysOnTop(!!on, 'screen-saver'));
ipcMain.on('win:opacity', (_e, value) => win && win.setOpacity(Math.max(0.3, Math.min(1, value))));
ipcMain.on('app:autostart', (_e, on) => app.setLoginItemSettings({ openAtLogin: !!on }));
ipcMain.handle('app:getAutostart', () => app.getLoginItemSettings().openAtLogin);

// Single-instance: focus existing window instead of opening a second gadget.
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => { if (win) { win.show(); win.focus(); } });

  app.whenReady().then(() => {
    createWindow();
    createTray();
    app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
  });

  // Keep running in the tray even when all windows are closed.
  app.on('window-all-closed', (e) => { /* stay alive in tray */ });
}
