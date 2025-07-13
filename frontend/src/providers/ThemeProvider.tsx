import React, { ReactNode } from 'react';
import { ThemeProvider as MuiThemeProvider, CssBaseline } from '@mui/material';
import { useAppSelector } from '../store/hooks';
import { selectTheme, selectLanguage } from '../store/slices/uiSlice';
import { themes } from '../theme';

// CSS for loading animation
const loadingStyles = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const themeMode = useAppSelector(selectTheme);
  const language = useAppSelector(selectLanguage);

  // Get the appropriate theme based on mode and language
  const currentTheme = themes[themeMode][language];

  return (
    <MuiThemeProvider theme={currentTheme}>
      <CssBaseline />
      <style>{loadingStyles}</style>
      {children}
    </MuiThemeProvider>
  );
};

export default ThemeProvider;