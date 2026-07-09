import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00f0ff', // Cyberpunk neon cyan
      light: '#70f9ff',
      dark: '#00a3b0',
      contrastText: '#000000',
    },
    secondary: {
      main: '#ff007f', // Neon pink / magenta
      light: '#ff66b2',
      dark: '#b30059',
      contrastText: '#ffffff',
    },
    background: {
      default: '#0b0f19', // Deep space background
      paper: '#121829', // Card / dialog background
    },
    text: {
      primary: '#f1f5f9',
      secondary: '#94a3b8',
    },
    success: {
      main: '#00ff66',
    },
    error: {
      main: '#ff003c',
    },
    warning: {
      main: '#ffab00',
    },
    info: {
      main: '#00b0ff',
    },
  },
  typography: {
    fontFamily: '"Outfit", "Helvetica Neue", Arial, sans-serif',
    h1: {
      fontFamily: '"Rajdhani", sans-serif',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '1px',
    },
    h2: {
      fontFamily: '"Rajdhani", sans-serif',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '1px',
    },
    h3: {
      fontFamily: '"Rajdhani", sans-serif',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    },
    h4: {
      fontFamily: '"Rajdhani", sans-serif',
      fontWeight: 600,
      textTransform: 'uppercase',
    },
    h5: {
      fontFamily: '"Rajdhani", sans-serif',
      fontWeight: 600,
    },
    h6: {
      fontFamily: '"Outfit", sans-serif',
      fontWeight: 600,
    },
    button: {
      fontFamily: '"Rajdhani", sans-serif',
      fontWeight: 700,
      letterSpacing: '1px',
      fontSize: '1rem',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'uppercase',
          padding: '8px 20px',
          boxShadow: 'none',
          transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
          '&:hover': {
            boxShadow: '0 0 12px rgba(0, 240, 255, 0.4)',
            transform: 'translateY(-1px)',
          },
          '&.MuiButton-containedPrimary': {
            background: 'linear-gradient(135deg, #00f0ff 0%, #00a3b0 100%)',
            color: '#000000',
            '&:hover': {
              background: 'linear-gradient(135deg, #70f9ff 0%, #00f0ff 100%)',
              boxShadow: '0 0 15px rgba(0, 240, 255, 0.6)',
            },
          },
          '&.MuiButton-containedSecondary': {
            background: 'linear-gradient(135deg, #ff007f 0%, #b30059 100%)',
            color: '#ffffff',
            '&:hover': {
              background: 'linear-gradient(135deg, #ff66b2 0%, #ff007f 100%)',
              boxShadow: '0 0 15px rgba(255, 0, 127, 0.6)',
            },
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          backgroundColor: 'rgba(18, 24, 41, 0.85)',
          backgroundImage: 'none',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
          transition: 'all 0.3s ease',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        },
        head: {
          fontFamily: '"Rajdhani", sans-serif',
          fontWeight: 700,
          color: '#00f0ff',
          fontSize: '0.95rem',
          letterSpacing: '0.5px',
          backgroundColor: 'rgba(18, 24, 41, 0.6)',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: '#0a0f1d',
          border: '1px solid rgba(22, 224, 255, 0.15)',
          backgroundImage: 'none',
          color: '#ffffff',
          borderRadius: 12,
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontFamily: '"Rajdhani", sans-serif',
          fontWeight: 800,
          fontSize: '1.4rem',
          color: '#ffffff',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        },
      },
    },
  },
});

export default theme;
