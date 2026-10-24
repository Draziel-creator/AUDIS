import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeType } from '../types';

interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  setTheme: () => {}
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeType>(() => {
    return (localStorage.getItem('audis_theme') as ThemeType) || 'dark';
  });

  useEffect(() => {
    // Remove previous theme classes
    const root = document.documentElement;
    const body = document.body;
    root.classList.remove('theme-dark', 'theme-light', 'theme-blue', 'theme-crimson', 'theme-violet');
    body.classList.remove('theme-dark', 'theme-light', 'theme-blue', 'theme-crimson', 'theme-violet');

    // Add current theme class
    root.classList.add(`theme-${theme}`);
    body.classList.add(`theme-${theme}`);

    // If light theme, remove dark mode text colors
    if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
    }
    localStorage.setItem('audis_theme', theme);
  }, [theme]);

  const setTheme = (newTheme: ThemeType) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
