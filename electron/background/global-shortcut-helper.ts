import { app, globalShortcut, ipcMain } from 'electron';
import { getSettings } from '@/background/electron-store-helper';

let oldAccelerator = '';

export function registerShortcut() {
  const settings = getSettings();
  const shortcut = settings.shortcut || {};

  const accelerators = [
    ...(shortcut.commandOrControl ? ['CommandOrControl'] : []),
    ...(shortcut.alt ? ['Alt'] : []),
    ...(shortcut.shift ? ['Shift'] : []),
    ...(shortcut.key ? [shortcut.key] : []),
  ];

  const accelerator = accelerators.join('+');
  console.log('[global-shortcut-helper] accelerator', accelerator);

  if (accelerator != oldAccelerator) {
    if (oldAccelerator) {
      globalShortcut.unregister(oldAccelerator);
      oldAccelerator = '';
    }
    if (accelerator && shortcut.key) {
      try {
        const result = globalShortcut.register(accelerator, () => {
          ipcMain.emit('global-shortcut-focus');
        });
        if (result) {
          oldAccelerator = accelerator;
        } else {
          console.log('[global-shortcut-helper] register failed.', 'No error.');
        }
      } catch (error) {
        console.log('[global-shortcut-helper] register failed.', error);
      }
    }
  }
}

app.whenReady().then(() => {
  registerShortcut();
});
