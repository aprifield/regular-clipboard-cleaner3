import type { BrowserWindow } from 'electron';
import type { ExecException } from 'node:child_process';
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

// // Scheme must be registered before the app is ready
// protocol.registerSchemesAsPrivileged([
//   { scheme: 'app', privileges: { secure: true, standard: true } },
// ]);

// async function createWindow(mode: 'history' | 'settings') {
//   const settings = getSettings();
//   // Create the browser window.
//   const win = new BrowserWindow({
//     icon: path.join(
//       __static,
//       process.platform === 'win32' ? 'icon.ico' : 'icon-16x16.png'
//     ),
//     frame: mode === 'settings' || settings.showFrame,
//     maximizable: false,
//     show: false,
//     skipTaskbar: mode === 'history' && !settings.showTaskbarIcon,
//     webPreferences: {
//       // Use pluginOptions.nodeIntegration, leave this alone
//       // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
//       // nodeIntegration: (process.env
//       //   .ELECTRON_NODE_INTEGRATION as unknown) as boolean,
//       nodeIntegration: false,
//       contextIsolation: true,
//       preload: path.join(__dirname, 'preload.js'),
//       spellcheck: false,
//     },
//   });
//   if (mode === 'settings') {
//     settingsWin = win;
//     showDockIcon();
//   } else {
//     historyWin = win;
//   }

//   const params = [
//     `mode=${mode}`,
//     `locale=${app.getLocale()}`,
//     `platform=${process.platform}`,
//   ].join('&');
//   if (process.env.WEBPACK_DEV_SERVER_URL) {
//     // Load the url of the dev server if in development mode
//     await win.loadURL(
//       `${process.env.WEBPACK_DEV_SERVER_URL as string}?${params}`
//     );
//     if (!process.env.IS_TEST) win.webContents.openDevTools();
//   } else {
//     createProtocol('app');
//     // Load the index.html when not in development
//     win.loadURL(`app://./index.html?${params}`);
//   }

//   const _setWindowSettings = () => {
//     setWindowSettings(mode, win.getBounds());
//   };

//   win.on('closed', () => {
//     if (mode === 'settings') {
//       settingsWin = null;
//       switchDockIcon();
//     } else {
//       historyWin = null;
//     }
//   });

//   win.on('moved', () => {
//     _setWindowSettings();
//   });

//   win.on('resized', () => {
//     _setWindowSettings();
//   });
// }

export async function hideWindow(
  { historyWin, settingsWin }: ClipboardWindow,
  mode: 'history' | 'settings'
) {
  const win = mode === 'settings' ? settingsWin : historyWin;
  if (win) {
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
}

// // Quit when all windows are closed.
// app.on('window-all-closed', () => {
//   // On macOS it is common for applications and their menu bar
//   // to stay active until the user quits explicitly with Cmd + Q
//   if (process.platform !== 'darwin') {
//     // app.quit();
//   }
// });

// app.on('activate', () => {
//   // On macOS it's common to re-create a window in the app when the
//   // dock icon is clicked and there are no other windows open.
//   if (BrowserWindow.getAllWindows().length === 0) showOrCreateWindow('history');
// });

// // This method will be called when Electron has finished
// // initialization and is ready to create browser windows.
// // Some APIs can only be used after this event occurs.
// app.on('ready', async () => {
//   if (isDevelopment && !process.env.IS_TEST) {
//     // Install Vue Devtools
//     try {
//       await installExtension(VUEJS_DEVTOOLS);
//     } catch (e) {
//       console.error('Vue Devtools failed to install:', e);
//     }
//   }
// });

// // Exit cleanly on request from parent process in development mode.
// if (isDevelopment) {
//   if (process.platform === 'win32') {
//     process.on('message', (data) => {
//       if (data === 'graceful-exit') {
//         app.quit();
//       }
//     });
//   } else {
//     process.on('SIGTERM', () => {
//       app.quit();
//     });
//   }
// }

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
    historyWin.webContents.send('init-history', historyItems);
    historyWin.webContents.send('init-settings', settings);
  }
  if (settingsWin) {
    settingsWin.webContents.send('init-history', historyItems);
    settingsWin.webContents.send('init-settings', settings);
  }
}

export function copyTextAndPostProcess(
  { historyWin, settingsWin }: ClipboardWindow,
  text: string,
  historyEvent: HistoryEvent
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

  if (settings.closeAfterCopy && historyWin) {
    hideWindow({ historyWin, settingsWin }, 'history');
  }

  if (!isPastePrevent) {
    if (settings.pasteAfterCopy) {
      setTimeout(() => {
        const path = exePath();
        console.log('path', path);
        execFile(path, ['^v'], (error, stdout, stderr) => {
          if (error) {
            console.error('error:', error); // FIXME
            return;
          }
          console.log('stdout:', stdout); // FIXME
          console.log('stderr:', stderr); // FIXME
        });
      }, rules.pasteAfterCopyTimeout.value(settings.pasteAfterCopyTimeout));
    }
    if (settings.commandAfterCopy) {
      setTimeout(() => {
        exec(settings.commandAfterCopy!, (error: ExecException | null) => {
          if (error) {
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
