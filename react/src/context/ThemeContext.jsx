import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);
const THEME_KEY = 'pref:theme';

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(()=> localStorage.getItem(THEME_KEY) || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark':'light'));

  useEffect(()=>{
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t=> t === 'dark' ? 'light' : 'dark');

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme(){
  const ctx = useContext(ThemeContext);
  if(!ctx) throw new Error('ThemeContext missing');
  return ctx;
}
