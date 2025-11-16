import type { Settings } from '@/types/settings';
import path from 'node:path';
// import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { app, BrowserWindow, ipcMain, screen } from 'electron';
// import { HistoryEvent } from '@/types/history-event';
// import './background/app-menu-helper'; // FIXME
import { deleteAllHistory } from './background/clipboard-cleaner';
import {
  getSettings,
  getWindowSettings,
  setSettings,
} from './background/electron-store-helper';
import { sendToWebContents } from './background/main-helper';
import { iconPath } from './background/static-helper';
import './background/app-tray-helper';

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

let historyWin: BrowserWindow | null;
let settingsWin: BrowserWindow | null = null;

function createWindow(mode: 'history' | 'settings') {
  const win = new BrowserWindow({
    icon: iconPath(),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
    },
  });
  if (mode === 'settings') {
    settingsWin = win;
    // showDockIcon(); // FIXME
  } else {
    historyWin = win;
  }

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    historyWin?.webContents.send(
      'main-process-message', // FIXME
      new Date().toLocaleString()
    );
  });

  const params = [
    `mode=${mode}`,
    `locale=${app.getLocale()}`,
    `platform=${process.platform}`,
  ].join('&');
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(`${VITE_DEV_SERVER_URL}?${params}`);
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, `index.html?${params}`));
  }

  const _setWindowSettings = () => {
    // setWindowSettings(mode, win.getBounds()); // FIXME
  };

  win.on('closed', () => {
    if (mode === 'settings') {
      settingsWin = null;
      // switchDockIcon(); // FIXME
    } else {
      historyWin = null;
    }
  });

  win.on('moved', () => {
    _setWindowSettings();
  });

  win.on('resized', () => {
    _setWindowSettings();
  });
}

async function showOrCreateWindow(mode: 'history' | 'settings') {
  const win = mode === 'settings' ? settingsWin : historyWin;
  if (win) {
    const settings = getSettings();
    const windowSettings = getWindowSettings(mode);
    const bounds = {
      ...win.getBounds(),
      ...windowSettings,
    };
    if (mode === 'history' && settings.showNearCursor) {
      const point = screen.getCursorScreenPoint();
      bounds.x = point.x;
      bounds.y = point.y;
    }
    const display = screen.getDisplayNearestPoint(bounds);
    const displayLeft = display.workArea.x;
    const displayRight = display.workArea.x + display.workArea.width;
    const displayTop = display.workArea.y;
    const displayBottom = display.workArea.y + display.workArea.height;
    if (displayRight < bounds.x + bounds.width) {
      bounds.x -= bounds.x + bounds.width - displayRight;
    }
    if (bounds.x < displayLeft) {
      bounds.x = displayLeft;
    }
    if (displayBottom < bounds.y + bounds.height) {
      bounds.y -= bounds.y + bounds.height - displayBottom;
    }
    if (bounds.y < displayTop) {
      bounds.y = displayTop;
    }
    win.setOpacity(0);
    win.show(); // When minimized, show must be run before setBounds
    const setBounds: 'setBounds' | 'setContentBounds' =
      mode === 'history' && settings.showNearCursor
        ? 'setContentBounds'
        : 'setBounds';
    win[setBounds](bounds);
    win[setBounds](bounds); // When using multiple displays, a single position adjustment will not display the correct position
    setTimeout(() => {
      win.setOpacity(1);
    });
  } else {
    createWindow(mode);
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    showOrCreateWindow('history');
  }
});

ipcMain
  .on('web-app-created', () => {
    sendToWebContents(historyWin, settingsWin);
  })
  .on(
    'web-app-mounted',
    (_event, { mode }: { mode: 'history' | 'settings' }) => {
      showOrCreateWindow(mode);
    }
  )
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
  //     // sendToWebContents(historyWin, settingsWin);
  //   })
  .on('web-settings-change', (event, { settings }: { settings: Settings }) => {
    console.log('settings', settings); // FIXME
    if (historyWin && getSettings().showFrame !== settings.showFrame) {
      historyWin.close();
    }
    setSettings(settings);
    // restartMonitoring(); // FIXME
    // registerShortcut();
    // setOpenAtLogin();
    // switchTaskbarIcon(historyWin);
    sendToWebContents(historyWin, settingsWin);
  })
  // .on('app-menu-settings-click', () => {
  //   console.log('xxxxxxxxxxxxxxxxxxxx');
  //   showOrCreateWindow('settings');
  // })
  //   .on('app-menu-delete-all-history-click', () => {
  //     // deleteAllHistory();
  //     // sendToWebContents(historyWin, settingsWin);
  //   })
  .on('app-tray-history-click', () => {
    showOrCreateWindow('history');
  })
  .on('app-tray-settings-click', () => {
    showOrCreateWindow('settings');
  })
  .on('app-tray-delete-all-history-click', () => {
    deleteAllHistory();
    sendToWebContents(historyWin, settingsWin);
  })
  .on('app-tray-exit-click', () => {
    app.quit();
  })
  //   .on('global-shortcut-focus', () => {
  //     //showOrCreateWindow('history');
  //   })
  .on('clipboard-history-change', () => {
    sendToWebContents(historyWin, settingsWin);
  });

app.whenReady().then(() => showOrCreateWindow('history'));
