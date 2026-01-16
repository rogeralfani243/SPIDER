// src/theme/index.js
import { createTheme } from '@mui/material/styles';
import '../styles/modules_colors/var.css'

// Définition des couleurs de votre marque
const primaryGradient = 'linear-gradient(135deg, rgb(10, 10, 10), rgb(60, 10, 10), rgb(180, 20, 20), rgb(255, 0, 80))';
const colorText ='#a80e0eff';
const secondaryGradient = 'linear-gradient(190deg, rgb(10, 10, 10), rgb(60, 10, 10),rgb(180, 20, 20), rgb(255, 0, 80))'
const brandColors = {
  primary: {
    main: '#1976d2',
    light: '#42a5f5',
    dark: '#1565c0',
    contrastText: '#ffffff',
  },
  secondary: {
    main: '#9c27b0',
    light: '#ba68c8',
    dark: '#7b1fa2',
    contrastText: '#ffffff',
  },
  success: {
    main: '#4caf50',
    light: '#81c784',
    dark: '#388e3c',
    contrastText: '#ffffff',
  },
  error: {
    main: '#f44336',
    light: '#e57373',
    dark: '#d32f2f',
    contrastText: '#ffffff',
  },
  warning: {
    main: '#ff9800',
    light: '#ffb74d',
    dark: '#f57c00',
    contrastText: '#ffffff',
  },
  info: {
    main: '#2196f3',
    light: '#64b5f6',
    dark: '#1976d2',
    contrastText: '#ffffff',
  },
};

// Configuration du thème
const themeOptions = {
  palette: {
    mode: 'light',
    ...brandColors,
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
    text: {
      primary: 'rgba(0, 0, 0, 0.87)',
      secondary: 'rgba(0, 0, 0, 0.6)',
      disabled: 'rgba(0, 0, 0, 0.38)',
    },
  },
  
  // Style global de tous les composants
  components: {
    // === STYLE DES CHIPS ===
    MuiChip: {
      defaultProps: {
        size: 'medium',
      },
      styleOverrides: {
        root: {
          borderRadius: 16,
          fontWeight: 500,
          fontSize: '0.8125rem',
          letterSpacing: '0.01em',
          transition: 'all 0.2s ease-in-out',
          borderWidth: 1,
          borderStyle: 'solid',
          
          // Style par défaut (filled)
          '&.MuiChip-filled': {
            boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
            
            '&:hover': {
              transform: 'translateY(-1px)',
              boxShadow: '0 3px 6px rgba(0,0,0,0.15)',
            },
            
            '&:active': {
              transform: 'translateY(0)',
              boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
            },
          },
          
          // Style outlined
          '&.MuiChip-outlined': {
            backgroundColor: 'transparent',
            borderWidth: 2,
            
            '&:hover': {
              backgroundColor: 'rgba(25, 118, 210, 0.04)',
              transform: 'translateY(-1px)',
            },
          },
          
          // Style avec dégradé pour les chips primary
          '&.MuiChip-colorPrimary': {
            '&.MuiChip-filled': {
              background: primaryGradient,
              color: 'white',
              borderColor: 'transparent',
              
              '&:hover': {
                background: primaryGradient,
                opacity: 0.9,
              },
            },
            
            '&.MuiChip-outlined': {
              borderColor: '#a80e0eff',
              color: '#a80e0eff',
              
              '&:hover': {
                borderColor: 'white',
                color: 'white',
                background: primaryGradient,
              },
            },
          },
          
          // Style avec icône
          '& .MuiChip-icon': {
            fontSize: '1rem',
            marginLeft: 8,
          },
          
          '& .MuiChip-iconSmall': {
            fontSize: '0.875rem',
          },
          
          '& .MuiChip-iconMedium': {
            fontSize: '1rem',
          },
          
          // Style du label
          '& .MuiChip-label': {
            padding: '0 12px',
          },
          
          '& .MuiChip-labelSmall': {
            fontSize: '0.75rem',
            padding: '0 8px',
          },
          
          '& .MuiChip-labelMedium': {
            fontSize: '0.8125rem',
          },
          
          // Style avec avatar
          '& .MuiChip-avatar': {
            width: 24,
            height: 24,
            marginLeft: 8,
          },
          
          // Style de suppression
          '& .MuiChip-deleteIcon': {
            fontSize: '1rem',
            color: 'inherit',
            opacity: 0.7,
            transition: 'opacity 0.2s',
            
            '&:hover': {
              opacity: 1,
              color: 'inherit',
            },
          },
          
          // Style du delete icon outlined
          '&.MuiChip-outlined .MuiChip-deleteIcon': {
            color: 'currentColor',
          },
        },
        
        // Tailles
        sizeSmall: {
          height: 24,
          fontSize: '0.75rem',
          
          '& .MuiChip-label': {
            padding: '0 8px',
          },
        },
        
        sizeMedium: {
          height: 32,
          fontSize: '0.8125rem',
        },
        
        // Couleurs
        colorSecondary: {
          '&.MuiChip-filled': {
            backgroundColor: brandColors.secondary.main,
            color: brandColors.secondary.contrastText,
            
            '&:hover': {
              backgroundColor: brandColors.secondary.dark,
            },
          },
        },
        
        colorSuccess: {
          '&.MuiChip-filled': {
            backgroundColor: brandColors.success.main,
            color: brandColors.success.contrastText,
            
            '&:hover': {
              backgroundColor: brandColors.success.dark,
            },
          },
          
          '&.MuiChip-outlined': {
            borderColor: brandColors.success.main,
            color: brandColors.success.main,
            
            '&:hover': {
              backgroundColor: 'rgba(76, 175, 80, 0.04)',
            },
          },
        },
        
        colorError: {
          '&.MuiChip-filled': {
            backgroundColor: brandColors.error.main,
            color: brandColors.error.contrastText,
            
            '&:hover': {
              backgroundColor: brandColors.error.dark,
            },
          },
          
          '&.MuiChip-outlined': {
            borderColor: brandColors.error.main,
            color: brandColors.error.main,
            
            '&:hover': {
              backgroundColor: 'rgba(244, 67, 54, 0.04)',
            },
          },
        },
        
        colorWarning: {
          '&.MuiChip-filled': {
            backgroundColor: brandColors.warning.main,
            color: brandColors.warning.contrastText,
            
            '&:hover': {
              backgroundColor: brandColors.warning.dark,
            },
          },
          
          '&.MuiChip-outlined': {
            borderColor: brandColors.warning.main,
            color: brandColors.warning.main,
            
            '&:hover': {
              backgroundColor: 'rgba(255, 152, 0, 0.04)',
            },
          },
        },
        
        colorInfo: {
          '&.MuiChip-filled': {
            backgroundColor: brandColors.info.main,
            color: brandColors.info.contrastText,
            
            '&:hover': {
              backgroundColor: brandColors.info.dark,
            },
          },
          
          '&.MuiChip-outlined': {
            borderColor: brandColors.info.main,
            color: brandColors.info.main,
            
            '&:hover': {
              backgroundColor: 'rgba(33, 150, 243, 0.04)',
            },
          },
        },
        
        // Variantes
        filled: {},
        outlined: {},
        
        // Disabled state
        disabled: {
          opacity: 0.5,
          pointerEvents: 'none',
        },
      },
    },
    
    // === STYLE GLOBAL DE TOUS LES BOUTONS ===
    MuiButton: {
      defaultProps: {
        disableElevation: true,
        disableRipple: false,
      },
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
          padding: '8px 16px',
          fontSize: '0.875rem',
          transition: 'all 0.2s ease-in-out',
          
          '&.MuiButton-contained': {
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            '&:hover': {
              boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
              transform: 'translateY(-1px)',
              background: primaryGradient
            },
           
            '&:active': {
              boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
              transform: 'translateY(0)',
            },
          },
          '&.MuiButton-contained-search':{
            background:primaryGradient,
            color:'white',
            '&:hover': {
                    transform: 'translateY(2px)',
              background: secondaryGradient
            },
              '&:active': {
              boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
              transform: 'translateY(0)',
            },
          },

                    '&.MuiButton-contained-create': {
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      background: primaryGradient,
                      color:'white',
            '&:hover': {
              boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
              transform: 'translateY(-1px)',
              background: secondaryGradient,
            },
           
            '&:active': {
              boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
              transform: 'translateY(0)',
            },
          },          

                    '&.MuiButton-contained2': {
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            '&:hover': {
              boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
              transform: 'translateY(-1px)',
 
            },
           
            '&:active': {
              boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
              transform: 'translateY(0)',
            },
          },
          '&.MuiButton-outlined': {
            borderWidth: 2,
            borderColor: '#a80e0eff',
            color: '#a80e0eff',
            '&:hover': {
              borderColor: 'white',
              color: 'white',
              background: primaryGradient
            },
          },
          
          '&.MuiButton-text': {
            '&:hover': {
              backgroundColor: 'rgba(25, 118, 210, 0.04)',
            },
          },
          
          '&.Mui-disabled': {
            opacity: 0.5,
          },
        },
        
        sizeSmall: {
          padding: '6px 12px',
          fontSize: '0.75rem',
        },
        sizeMedium: {
          padding: '8px 16px',
          fontSize: '0.875rem',
        },
        sizeLarge: {
          padding: '10px 22px',
          fontSize: '0.9375rem',
        },
      },
    },
  
    // === STYLE DES TABS ===
    MuiTab: {
      styleOverrides: {
        root: {
          '& .MuiBox-root': {
            display: 'flex',
            alignItems: 'center',
          },
          '& .MuiSvgIcon-root': {
            marginRight: 8,
            fontSize: 20,
          },
          '& .MuiBadge-root': {
            marginLeft: 8,
          },
          '&:hover': {
            background: primaryGradient
          },
        },
      },
    },
    
    // === STYLE DES BADGES DANS LES TABS ===
    MuiBadge: {
      styleOverrides: {
        root: {
          '&.MuiBadge-root': {
            '& .MuiBadge-badge': {
              fontSize: '0.75rem',
              height: 20,
              minWidth: 20,
            },
          },
        },
      },
    },
    
    // === STYLE DES ICONBUTTONS ===
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            backgroundColor: 'rgba(25, 118, 210, 0.08)',
            transform: 'scale(1.05)',
          },
        },
      },
    },
    
    // === STYLE DES FAB ===
    MuiFab: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          '&:hover': {
            boxShadow: '0 6px 16px rgba(0,0,0,0.2)',
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    
    // === STYLE DES DIALOGUES ===
    MuiDialogActions: {
      styleOverrides: {
        root: {
          padding: '16px 24px',
          '& .MuiButton-root': {
            minWidth: 80,
          },
        },
      },
    },
 MuiOutlinedInput: {
      styleOverrides: {
        root: {
          // Bordure normale
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: '#ccc',
            borderWidth: '1px',
          },
          
          // Au hover
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#999',
            borderWidth: '2px',
          },
          
          // Au focus - C'EST ICI QU'IL FAUT STYLER
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: colorText ,
            borderWidth: '2px !important',
        
          },
          
          // Pour le label au focus
          '&.Mui-focused .MuiInputLabel-root': {
            color: colorText,
          },
        },}},
    // === STYLE DES MENUS ===
  MuiSelect: {
 styleOverrides: {
        root: {
          
            '&.Mui-focused': {
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: colorText,
              borderWidth: '2px',
            },
          },
        },
      },
     '&:focus': {
            borderColor:'red',
            border:'1px red  solid'
          },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          margin: '2px 8px',
          '&:hover': {
            backgroundColor: 'rgba(25, 118, 210, 0.08)',
          },
                  
        },
      },
    },
  },
  
  // Typographie
  typography: {
    color: colorText,
    fontFamily: [
      '"Inter"',
      '"Roboto"',
      '"Helvetica"',
      '"Arial"',
      'sans-serif',
    ].join(','),
    button: {
      fontWeight: 600,
      letterSpacing: '0.01em',
    },
  },
  
  // Formes globales
  shape: {
    borderRadius: 8,
  },
  
  // Ombres (liste complète) - gardez la même liste
  shadows: [
    'none',
    '0px 2px 1px -1px rgba(0,0,0,0.2),0px 1px 1px 0px rgba(0,0,0,0.14),0px 1px 3px 0px rgba(0,0,0,0.12)',
    '0px 3px 1px -2px rgba(0,0,0,0.2),0px 2px 2px 0px rgba(0,0,0,0.14),0px 1px 5px 0px rgba(0,0,0,0.12)',
    '0px 2px 4px -1px rgba(0,0,0,0.2),0px 4px 5px 0px rgba(0,0,0,0.14),0px 1px 10px 0px rgba(0,0,0,0.12)',
    '0px 3px 5px -1px rgba(0,0,0,0.2),0px 5px 8px 0px rgba(0,0,0,0.14),0px 1px 14px 0px rgba(0,0,0,0.12)',
    '0px 3px 5px -1px rgba(0,0,0,0.2),0px 6px 10px 0px rgba(0,0,0,0.14),0px 1px 18px 0px rgba(0,0,0,0.12)',
    '0px 4px 5px -2px rgba(0,0,0,0.2),0px 7px 10px 1px rgba(0,0,0,0.14),0px 2px 16px 1px rgba(0,0,0,0.12)',
    '0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12)',
    '0px 5px 6px -3px rgba(0,0,0,0.2),0px 9px 12px 1px rgba(0,0,0,0.14),0px 3px 16px 2px rgba(0,0,0,0.12)',
    '0px 6px 6px -3px rgba(0,0,0,0.2),0px 10px 14px 1px rgba(0,0,0,0.14),0px 4px 18px 3px rgba(0,0,0,0.12)',
    '0px 6px 7px -4px rgba(0,0,0,0.2),0px 11px 15px 1px rgba(0,0,0,0.14),0px 4px 20px 3px rgba(0,0,0,0.12)',
    '0px 7px 8px -4px rgba(0,0,0,0.2),0px 12px 17px 2px rgba(0,0,0,0.14),0px 5px 22px 4px rgba(0,0,0,0.12)',
    '0px 7px 8px -4px rgba(0,0,0,0.2),0px 13px 19px 2px rgba(0,0,0,0.14),0px 5px 24px 4px rgba(0,0,0,0.12)',
    '0px 7px 9px -4px rgba(0,0,0,0.2),0px 14px 21px 2px rgba(0,0,0,0.14),0px 5px 26px 4px rgba(0,0,0,0.12)',
    '0px 8px 9px -5px rgba(0,0,0,0.2),0px 15px 22px 2px rgba(0,0,0,0.14),0px 6px 28px 5px rgba(0,0,0,0.12)',
    '0px 8px 10px -5px rgba(0,0,0,0.2),0px 16px 24px 2px rgba(0,0,0,0.14),0px 6px 30px 5px rgba(0,0,0,0.12)',
    '0px 8px 11px -5px rgba(0,0,0,0.2),0px 17px 26px 2px rgba(0,0,0,0.14),0px 6px 32px 5px rgba(0,0,0,0.12)',
    '0px 9px 11px -5px rgba(0,0,0,0.2),0px 18px 28px 2px rgba(0,0,0,0.14),0px 7px 34px 6px rgba(0,0,0,0.12)',
    '0px 9px 12px -6px rgba(0,0,0,0.2),0px 19px 29px 2px rgba(0,0,0,0.14),0px 7px 36px 6px rgba(0,0,0,0.12)',
    '0px 10px 13px -6px rgba(0,0,0,0.2),0px 20px 31px 3px rgba(0,0,0,0.14),0px 8px 38px 7px rgba(0,0,0,0.12)',
    '0px 10px 13px -6px rgba(0,0,0,0.2),0px 21px 33px 3px rgba(0,0,0,0.14),0px 8px 40px 7px rgba(0,0,0,0.12)',
    '0px 10px 14px -6px rgba(0,0,0,0.2),0px 22px 35px 3px rgba(0,0,0,0.14),0px 8px 42px 7px rgba(0,0,0,0.12)',
    '0px 11px 14px -7px rgba(0,0,0,0.2),0px 23px 36px 3px rgba(0,0,0,0.14),0px 9px 44px 8px rgba(0,0,0,0.12)',
    '0px 11px 15px -7px rgba(0,0,0,0.2),0px 24px 38px 3px rgba(0,0,0,0.14),0px 9px 46px 8px rgba(0,0,0,0.12)',
  ],
};

// Création du thème
const theme = createTheme(themeOptions);

export default theme;