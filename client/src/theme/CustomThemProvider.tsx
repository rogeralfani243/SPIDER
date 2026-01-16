// src/providers/ThemeProvider.tsx
import React from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { GlobalStyles } from '@mui/material';
import theme from './Theme';

interface ThemeProviderProps {
  children: React.ReactNode;
}

const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      {/* Styles globaux supplémentaires */}
      <GlobalStyles
        styles={{
          // Styles pour les boutons HTML natifs pour qu'ils correspondent au thème
          'button:not(.MuiButton-root)': {
            borderRadius: '8px',
            padding: '8px 16px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.875rem',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              opacity: 0.9,
            },
      
          },
        }}
      />
      {children}
    </MuiThemeProvider>
  );
};

export default ThemeProvider;