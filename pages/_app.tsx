import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';

export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  const theme = createTheme({
    palette: {
      mode: 'dark',
      background: {
        default: '#0a0a0a',
        paper: '#171717',
      },
      text: {
        primary: '#ededed',
        secondary: '#bdbdbd',
      },
      primary: {
        main: '#ededed',
        contrastText: '#0a0a0a',
      },
      secondary: {
        main: '#bdbdbd',
        contrastText: '#0a0a0a',
      },
      success: {
        main: '#4caf50',
      },
      error: {
        main: '#f44336',
      },
      warning: {
        main: '#ff9800',
      },
      info: {
        main: '#2196f3',
      },
    },
    shape: {
      borderRadius: 16,
    },
    typography: {
      fontFamily: 'Geist, Arial, Helvetica, sans-serif',
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
    },
  });
  return (
    <SessionProvider session={session}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Component {...pageProps} />
      </ThemeProvider>
    </SessionProvider>
  );
}
