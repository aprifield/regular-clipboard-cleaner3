import type { HistoryEvent } from '@/types/history-event';
import type { Settings } from '@/types/settings';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { app, BrowserWindow, ipcMain, screen } from 'electron';
import { showDockIcon, switchDockIcon } from './background/app-dock-helper';
import { setOpenAtLogin } from './background/app-login-helper';
import { switchTaskbarIcon } from './background/app-taskbar-helper';
import {
  deleteAllHistory,
  deleteHistory,
  restartMonitoring,
} from './background/clipboard-cleaner';
import {
  getSettings,
  getWindowSettings,
  setSettings,
  setWindowSettings,
} from './background/electron-store-helper';
import { registerShortcut } from './background/global-shortcut-helper';
import {
  copyTextAndPostProcess,
  hideWindow,
  sendToWebContents,
} from './background/main-helper';
import { iconPath } from './background/static-helper';
import './background/app-menu-helper';
import './background/app-tray-helper';

const gotTheLock = app.requestSingleInstanceLock();
if (gotTheLock) {
  app.on('second-instance', () => {
    showOrCreateWindow('history');
  });
} else {
  app.quit();
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));

process.env.APP_ROOT = path.join(__dirname, '..');

export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron');
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist');

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST;

let historyWin: BrowserWindow | null;
let settingsWin: BrowserWindow | null = null;

function win() {
  return { historyWin, settingsWin };
}

function createWindow(mode: 'history' | 'settings') {
  const settings = getSettings();

  const win = new BrowserWindow({
    icon: iconPath(),
    frame: mode === 'settings' || settings.showFrame,
    maximizable: false,
    show: false,
    skipTaskbar: mode === 'history' && !settings.showTaskbarIcon,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.mjs'),
      spellcheck: false,
    },
  });
  if (mode === 'settings') {
    settingsWin = win;
    showDockIcon();
  } else {
    historyWin = win;
  }

  const query = {
    mode,
    locale: app.getLocale(),
    platform: process.platform,
  };
  if (VITE_DEV_SERVER_URL) {
    const params = new URLSearchParams(query).toString();
    win.loadURL(`${VITE_DEV_SERVER_URL}?${params}`);
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'), {
      query,
    });
  }

  const _setWindowSettings = () => {
    setWindowSettings(mode, win.getBounds());
  };

  win.on('closed', () => {
    if (mode === 'settings') {
      settingsWin = null;
      switchDockIcon();
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
  .on('web:created', () => {
    sendToWebContents(win());
  })
  .on('web:mounted', (event, { mode }: { mode: 'history' | 'settings' }) => {
    showOrCreateWindow(mode);
  })
  .on(
    'web:click:list-item',
    (
      event,
      { text, historyEvent }: { text: string; historyEvent: HistoryEvent }
    ) => {
      copyTextAndPostProcess(win(), text, historyEvent, () => {
        hideWindow(historyWin);
      });
    }
  )
  .on(
    'web:keydown:enter',
    (
      event,
      { text, historyEvent }: { text: string; historyEvent: HistoryEvent }
    ) => {
      copyTextAndPostProcess(win(), text, historyEvent, () => {
        hideWindow(historyWin);
      });
    }
  )
  .on('web:keydown:escape', () => {
    hideWindow(historyWin);
  })
  .on('web:click:delete', (event, { text }: { text: string }) => {
    deleteHistory(text);
    sendToWebContents(win());
  })
  .on('web:change:settings', (event, { settings }: { settings: Settings }) => {
    if (historyWin && getSettings().showFrame !== settings.showFrame) {
      historyWin.close();
    }
    setSettings(settings);
    restartMonitoring();
    registerShortcut();
    setOpenAtLogin();
    switchTaskbarIcon(historyWin);
    sendToWebContents(win());
  })
  .on('native:click:menu-settings', () => {
    showOrCreateWindow('settings');
  })
  .on('native:click:menu-delete-all-history', () => {
    deleteAllHistory();
    sendToWebContents(win());
  })
  .on('app-tray-history-click', () => {
    showOrCreateWindow('history');
  })
  .on('app-tray-settings-click', () => {
    showOrCreateWindow('settings');
  })
  .on('app-tray-delete-all-history-click', () => {
    deleteAllHistory();
    sendToWebContents(win());
  })
  .on('native:click:tray-exit', () => {
    app.quit();
  })
  .on('native:keydown:global-shortcut', () => {
    showOrCreateWindow('history');
  })
  .on('clipboard-history-change', () => {
    sendToWebContents(win());
  });

app.whenReady().then(() => showOrCreateWindow('history'));
