// babel.config.js
module.exports = function (api) {
  const isProduction = api.env('production');
  
  return {
    presets: [
      'react-app'
    ],
    plugins: [
      isProduction && ['transform-remove-console', { 
        exclude: ['error', 'warn'] 
      }]
    ].filter(Boolean)
  };
};