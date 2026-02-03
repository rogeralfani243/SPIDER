// AppLogger.js - Version ultra simple (recommandée)
const isProduction = () => {
  // Évitez NODE_ENV pour les problèmes de build Vercel
  // Utilisez des variables personnalisées
  
  // 1. Variables d'environnement safe
  if (process.env.REACT_APP_ENV === 'production') return true;
  if (process.env.REACT_APP_IS_PROD === 'true') return true;
  
  // 2. Détection URL (dans le navigateur)
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const isLocal = 
      hostname === 'localhost' || 
      hostname === '127.0.0.1' ||
      hostname.includes('.local') ||
      hostname.startsWith('192.168.');
    
    const isVercelPreview = 
      hostname.includes('.vercel.app') &&
      !hostname.includes('--prod'); // Les previews ont un format spécial
    
    return !isLocal && !isVercelPreview;
  }
  
  // 3. Par défaut, développement
  return false;
};

const IS_PROD = isProduction();
const IS_DEV = !IS_PROD;

// Logger simple et efficace
const appLogger = {
  // Développement seulement
  log: (...args) => IS_DEV && console.log('[LOG]', ...args),
  debug: (...args) => IS_DEV && console.debug('[DEBUG]', ...args),
  info: (...args) => IS_DEV && console.info('[INFO]', ...args),
  success: (...args) => IS_DEV && console.log('✅', ...args),
  table: (data) => IS_DEV && console.table(data),
  group: (label) => IS_DEV && console.group(label),
  groupEnd: () => IS_DEV && console.groupEnd(),
  
  // Toujours visible
  warn: (...args) => console.warn('⚠️', ...args),
  error: (...args) => console.error('❌', ...args),
  critical: (...args) => console.error('🚨 [CRITICAL]', ...args),
  
  // Utilitaires
  isProduction: IS_PROD,
  isDevelopment: IS_DEV,
  
  // Pour le debugging
  env: () => ({
    isProd: IS_PROD,
    isDev: IS_DEV,
    REACT_APP_ENV: process.env.REACT_APP_ENV,
    hostname: typeof window !== 'undefined' ? window.location.hostname : 'server'
  })
};

export { appLogger };
export default appLogger;