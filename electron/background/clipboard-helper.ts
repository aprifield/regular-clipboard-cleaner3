// export function copyTextAndPostProcess(
//   { historyWin, settingsWin }: ClipboardWindow,
//   text: string,
//   historyEvent: HistoryEvent,
//   hideHistoryWindow: () => void
// ) {
//   const settings = getSettings();
//   const preprocessing = settings.preprocessing || defaultPreprocessing;

//   let isPastePrevent = false;
//   (historyEvent as PreprocessingHistoryEvent).preventPaste = () => {
//     isPastePrevent = true;
//   };
//   try {
//     text = eval(`(${preprocessing})(text, historyEvent)`);
//   } catch (error) {
//     text = error + '';
//   }

//   clipboard.writeText(text);

//   if (settings.closeAfterCopy) {
//     hideHistoryWindow();
//   }

//   if (!isPastePrevent) {
//     if (settings.pasteAfterCopy) {
//       setTimeout(() => {
//         const path = exePath();
//         execFile(path, ['^v'], (error) => {
//           if (error) {
//             // FIXME output message in dialog
//             dialog.showErrorBox(
//               'Paste Error',
//               `The command [${error.cmd}] failed.` // FIXME do test
//             );
//           }
//         });
//       }, rules.pasteAfterCopyTimeout.value(settings.pasteAfterCopyTimeout));
//     }
//     if (settings.commandAfterCopy) {
//       setTimeout(() => {
//         exec(settings.commandAfterCopy!, (error) => {
//           if (error) {
//             // FIXME output message in dialog
//             dialog.showErrorBox(
//               'Command Error',
//               `The command [${settings.commandAfterCopy}] failed.`
//             );
//           }
//         });
//       }, rules.commandAfterCopyTimeout.value(settings.commandAfterCopyTimeout));
//     }
//   }
// }
