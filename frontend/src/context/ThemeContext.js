import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

// Tema e salvată în localStorage și aplicată ca atribut data-theme pe <html>.
// CSS-ul (index.css) definește variabilele de culoare pentru fiecare temă.
export const ThemeProvider = ({ children }) => {
  const [tema, setTema] = useState(() => localStorage.getItem('tema') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', tema);
    localStorage.setItem('tema', tema);
  }, [tema]);

  const comutaTema = () => setTema(t => (t === 'dark' ? 'light' : 'dark'));

  return (
    <ThemeContext.Provider value={{ tema, setTema, comutaTema }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
