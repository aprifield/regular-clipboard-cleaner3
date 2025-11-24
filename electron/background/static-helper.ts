import path from 'node:path';

const isDevelopment = process.env.NODE_ENV === 'development';

// FIXME remove this file
export function iconPath() {
  return path.join(
    process.env.VITE_PUBLIC,
    process.platform === 'win32' ? 'icon.ico' : 'icon-16x16.png'
  );
}

export function exePath() {
  return isDevelopment
    ? path.join(process.env.APP_ROOT, 'resources', 'bin', 'DotNetKeySender.exe')
    : path.join(process.resourcesPath, 'bin', 'DotNetKeySender.exe');
}
