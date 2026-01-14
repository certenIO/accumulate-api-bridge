/**
 * Logger utility for CERTEN API Bridge
 */
export class Logger {
  private name: string;

  constructor(name: string) {
    this.name = name;
  }

  info(message: string, meta?: any) {
    const timestamp = new Date().toISOString();
    console.log(`[INFO] ${timestamp} [${this.name}] ${message}`, meta ? JSON.stringify(meta) : '');
  }

  error(message: string, meta?: any) {
    const timestamp = new Date().toISOString();
    console.error(`[ERROR] ${timestamp} [${this.name}] ${message}`, meta ? JSON.stringify(meta) : '');
  }

  warn(message: string, meta?: any) {
    const timestamp = new Date().toISOString();
    console.warn(`[WARN] ${timestamp} [${this.name}] ${message}`, meta ? JSON.stringify(meta) : '');
  }

  debug(message: string, meta?: any) {
    const timestamp = new Date().toISOString();
    if (process.env.LOG_LEVEL === 'debug' || process.env.DEBUG_TRANSACTIONS === 'true') {
      console.debug(`[DEBUG] ${timestamp} [${this.name}] ${message}`, meta ? JSON.stringify(meta) : '');
    }
  }
}
