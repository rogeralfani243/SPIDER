// utils/AppLogger.js
class AppLogger {
  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  log(...args) {
    if (!this.isProduction) {
      console.log('[LOG]', ...args);
    }
  }

  debug(...args) {
    if (!this.isProduction) {
      console.debug('[DEBUG]', ...args);
    }
  }

  info(...args) {
    if (!this.isProduction) {
      console.info('[INFO]', ...args);
    }
  }

  warn(...args) {
    console.warn('[WARN]', ...args);
  }

  error(...args) {
    console.error('[ERROR]', ...args);
  }

  success(...args) {
    if (!this.isProduction) {
      console.log('[SUCCESS]', ...args);
    }
  }

  table(...args) {
    if (!this.isProduction) {
      console.table(...args);
    }
  }

  group(...args) {
    if (!this.isProduction) {
      console.group(...args);
    }
  }

  groupEnd() {
    if (!this.isProduction) {
      console.groupEnd();
    }
  }
}

export default new AppLogger();

// Option 2 : Export nommé
// export const appLogger = new AppLogger();