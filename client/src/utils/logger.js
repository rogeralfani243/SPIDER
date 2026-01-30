// utils/logger.js
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

class Logger {
  constructor(prefix = 'App') {
    this.prefix = `[${prefix}]`;
    this.isProd = isProduction;
  }

  log(...args) {
    if (!this.isProd) {
      console.log(this.prefix, ...args);
    }
  }

  info(...args) {
    if (!this.isProd) {
      console.info(this.prefix, 'ℹ️', ...args);
    }
  }

  warn(...args) {
    if (!this.isProd) {
      console.warn(this.prefix, '⚠️', ...args);
    }
  }

  error(...args) {
    // Toujours afficher les erreurs
    console.error(this.prefix, '❌', ...args);
  }

  debug(...args) {
    if (isDevelopment) {
      console.debug(this.prefix, '🔍', ...args);
    }
  }

  success(...args) {
    if (!this.isProd) {
      console.log(this.prefix, '✅', ...args);
    }
  }

  // Pour les données sensibles (jamais en prod)
  sensitive(...args) {
    if (isDevelopment) {
      console.log(this.prefix, '🔒', ...args);
    }
  }
}

// Exportez une instance par défaut
export const appLogger = new Logger('App');

// Exportez une fonction pour créer des loggers avec préfixe
export const createLogger = (prefix) => new Logger(prefix);