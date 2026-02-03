// AppLogger.js - Version optimisée pour Vercel
class AppLogger {
  constructor() {
    // Pour Vercel, vérifiez plusieurs variables d'environnement
    this.isProduction = 
      process.env.NODE_ENV === 'production' ||
      process.env.REACT_APP_ENV === 'production' ||
      process.env.VERCEL_ENV === 'production' ||
      (typeof window !== 'undefined' && 
       !window.location.hostname.includes('localhost') && 
       !window.location.hostname.includes('vercel.app')); // Pour preview deployments
    
    this.isDevelopment = !this.isProduction;
    
    // Log de diagnostic (sera supprimé en prod par le plugin)
    console.log('[Logger] Mode:', this.isProduction ? 'PRODUCTION' : 'DEVELOPMENT');
    console.log('[Logger] NODE_ENV:', process.env.NODE_ENV);
    console.log('[Logger] REACT_APP_ENV:', process.env.REACT_APP_ENV);
    console.log('[Logger] VERCEL_ENV:', process.env.VERCEL_ENV);
  }

  log(...args) {
    if (this.isDevelopment) {
      console.log('[LOG]', ...args);
    }
  }

  debug(...args) {
    if (this.isDevelopment) {
      console.debug('[DEBUG]', ...args);
    }
  }

  info(...args) {
    if (this.isDevelopment) {
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
    if (this.isDevelopment) {
      console.log('[SUCCESS]', ...args);
    }
  }
}

export default new AppLogger();