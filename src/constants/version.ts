import packageJson from '../../package.json';

export const APP_VERSION = packageJson.version;

export const getImageUrl = (path: string): string => {
  return `${path}?v=${APP_VERSION}`;
};

