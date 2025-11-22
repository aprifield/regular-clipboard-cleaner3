import type { BrowserWindow } from 'electron';
import { nativeTheme } from 'electron';
import {
  getHistoryItems,
  getSettings,
  setSettings,
} from './electron-store-helper';

interface ClipboardWindow {
  // FIXME 消す
  historyWin: BrowserWindow | null;
  settingsWin: BrowserWindow | null;
}

export async function hideWindow(win: BrowserWindow | null) {
  if (!win) {
    return;
  }

  if (process.platform === 'darwin') {
    const settings = getSettings();
    if (settings.showDockIcon) {
      // Don't use setOpacity on mac because the minimized image is not displayed.
      win.minimize();
    } else {
      // Don't use hide on windows because the paste target will not be active.
      // The paste doesn't work on mac, so no problem.
      win.hide();
    }
  } else {
    win.setOpacity(0); // Disable minimization animation
    win.minimize();
    setTimeout(() => {
      win.setOpacity(1);
    });
  }
}

export function sendToWebContents({
  historyWin,
  settingsWin,
}: ClipboardWindow) {
  const historyItems = getHistoryItems();
  const settings = getSettings();
  if (settings.darkTheme === undefined) {
    settings.darkTheme = nativeTheme.shouldUseDarkColors;
    setSettings(settings);
  }
  if (historyWin) {
    historyWin.webContents.send('native:init:history', historyItems);
    historyWin.webContents.send('native:init:settings', settings);
  }
  if (settingsWin) {
    settingsWin.webContents.send('native:init:history', historyItems);
    settingsWin.webContents.send('native:init:settings', settings);
  }
}
