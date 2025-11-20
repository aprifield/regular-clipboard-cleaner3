import type { BrowserWindow } from 'electron';
import type {
  HistoryEvent,
  PreprocessingHistoryEvent,
} from '@/types/history-event';
import { exec, execFile } from 'node:child_process';
import { clipboard, dialog, nativeTheme } from 'electron';
import defaultPreprocessing from '@/util/preprocessing';
import rules from '@/util/rules';
import {
  getHistoryItems,
  getSettings,
  setSettings,
} from './electron-store-helper';
import { exePath } from './static-helper';

interface ClipboardWindow {
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

export function copyTextAndPostProcess(
  { historyWin, settingsWin }: ClipboardWindow,
  text: string,
  historyEvent: HistoryEvent,
  hideHistoryWindow: () => void
) {
  const settings = getSettings();
  const preprocessing = settings.preprocessing || defaultPreprocessing;

  let isPastePrevent = false;
  (historyEvent as PreprocessingHistoryEvent).preventPaste = () => {
    isPastePrevent = true;
  };
  try {
    text = eval(`(${preprocessing})(text, historyEvent)`);
  } catch (error) {
    text = error + '';
  }

  clipboard.writeText(text);

  if (settings.closeAfterCopy) {
    hideHistoryWindow();
  }

  if (!isPastePrevent) {
    if (settings.pasteAfterCopy) {
      setTimeout(() => {
        const path = exePath();
        execFile(path, ['^v'], (error) => {
          if (error) {
            // FIXME output message in dialog
            dialog.showErrorBox(
              'Paste Error',
              `The command [${error.cmd}] failed.` // FIXME do test
            );
          }
        });
      }, rules.pasteAfterCopyTimeout.value(settings.pasteAfterCopyTimeout));
    }
    if (settings.commandAfterCopy) {
      setTimeout(() => {
        exec(settings.commandAfterCopy!, (error) => {
          if (error) {
            // FIXME output message in dialog
            dialog.showErrorBox(
              'Command Error',
              `The command [${settings.commandAfterCopy}] failed.`
            );
          }
        });
      }, rules.commandAfterCopyTimeout.value(settings.commandAfterCopyTimeout));
    }
  }
}
