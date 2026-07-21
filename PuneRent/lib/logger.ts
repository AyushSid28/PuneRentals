export const logger = {
  info: (msg: string, ctx?: any) => console.log(`[INFO] ${msg}`, ctx ?? {}),
  error: (msg: string, ctx?: any) => console.error(`[ERROR] ${msg}`, ctx ?? {}),
  debug: (msg: string, ctx?: any) => console.debug(`[DEBUG] ${msg}`, ctx ?? {}),
};
