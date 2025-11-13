import path from 'node:path';
// import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { app, BrowserWindow, ipcMain } from 'electron';
import { HistoryEvent } from '@/types/history-event';
import { Settings } from '@/types/settings';
import './background/clipboard-cleaner';

// const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..');

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron');
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist');

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST;

const gotTheLock = app.requestSingleInstanceLock();
console.log('gotTheLock', gotTheLock);

let win: BrowserWindow | null;

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
    },
  });

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString());
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'));
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
    win = null;
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
    // showOrCreateWindow('history');
  }
});

ipcMain.on('web-app-created', () => {
  // sendToWebContents();
});
//   .on(
//     'web-app-mounted',
//     (event, [{ mode }]: [{ mode: 'history' | 'settings' }]) => {
//       // showOrCreateWindow(mode);
//       createWindow();
//     }
//   )
//   .on(
//     'web-list-item-click',
//     (event, [text, historyEvent]: [string, HistoryEvent]) => {
//       // copyTextAndPostProcess(text, historyEvent);
//     }
//   )
//   .on(
//     'web-enter-keydown',
//     (event, [text, historyEvent]: [string, HistoryEvent]) => {
//       // copyTextAndPostProcess(text, historyEvent);
//     }
//   )
//   .on('web-escape-keydown', () => {
//     if (historyWin) {
//       // hideWindow('history');
//     }
//   })
//   .on('web-delete-click', (event, [text]: [string]) => {
//     // deleteHistory(text);
//     // sendToWebContents();
//   })
//   .on('web-settings-change', (event, [settings]: [Settings]) => {
//     // if (historyWin) {
//     //   if (getSettings().showFrame !== settings.showFrame) {
//     //     historyWin.close();
//     //   }
//     // }
//     // setSettings(settings);
//     // restartMonitoring();
//     // registerShortcut();
//     // setOpenAtLogin();
//     // switchTaskbarIcon(historyWin);
//     // sendToWebContents();
//   })
//   .on('app-menu-settings-click', () => {
//     // showOrCreateWindow('settings');
//   })
//   .on('app-menu-delete-all-history-click', () => {
//     // deleteAllHistory();
//     // sendToWebContents();
//   })
//   .on('app-tray-history-click', () => {
//     // showOrCreateWindow('history');
//   })
//   .on('app-tray-settings-click', () => {
//     //showOrCreateWindow('settings');
//   })
//   .on('app-tray-delete-all-history-click', () => {
//     // deleteAllHistory();
//     // sendToWebContents();
//   })
//   .on('app-tray-exit-click', () => {
//     //app.quit();
//   })
//   .on('global-shortcut-focus', () => {
//     //showOrCreateWindow('history');
//   })
//   .on('clipboard-history-change', () => {
//     //sendToWebContents();
//   });

app.whenReady().then(createWindow);
