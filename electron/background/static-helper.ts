import path from 'node:path';

export const iconPath = () =>
  path.join(
    process.env.VITE_PUBLIC,
    process.platform === 'win32' ? 'icon.ico' : 'icon-16x16.png'
  );
