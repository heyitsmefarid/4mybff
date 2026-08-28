import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

/* Night is the designed default — the whole thing is an arcade cabinet. Day
   exists so she can actually read it outside. Her choice is remembered. */

const ThemeCtx = createContext({ theme: 'night', toggleTheme: () => {} });
const STORE_KEY = 'bday.theme';

const readStored = () => {
  try {
    const saved = localStorage.getItem(STORE_KEY);
    return saved === 'day' || saved === 'night' ? saved : 'night';
  } catch {
    return 'night';
  }
};

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(readStored);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'day' ? '#fff2f7' : '#0d0418');
    try {
      localStorage.setItem(STORE_KEY, theme);
    } catch {
      /* private browsing — she just re-picks it next time */
    }
  }, [theme]);

  const toggleTheme = useCallback(() => setTheme((t) => (t === 'day' ? 'night' : 'day')), []);

  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);
  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export const useTheme = () => useContext(ThemeCtx);
