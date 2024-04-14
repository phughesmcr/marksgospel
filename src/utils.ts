import { dirname, fromFileUrl } from 'path';

export const getMetaPath = (): string => dirname(fromFileUrl(import.meta.url));

export const replaceBom = (str: string): string => {
  return str.replaceAll(/^\uFEFF/gm, '').replaceAll(/^\u00BB\u00BF/gm, '');
};

export const exitWithError = (code = 1, msg?: string | Error): void => {
  if (msg && typeof msg === 'string') console.error(msg);
  if (msg && msg instanceof Error) console.error(msg.message);
  Deno.exit(code);
};
