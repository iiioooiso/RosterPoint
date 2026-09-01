"use client";

import * as React from "react";

const ThemeContext = React.createContext<{
  theme: string;
  setTheme: (theme: string) => void;
}>({ theme: "system", setTheme: () => null });

export function ThemeProvider({ children, defaultTheme = "system" }: { children: React.ReactNode, defaultTheme?: string }) {
  const [theme, setThemeState] = React.useState(defaultTheme);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("scoped-theme");
    if (stored) setThemeState(stored);
  }, []);

  const setTheme = React.useCallback((newTheme: string) => {
    setThemeState(newTheme);
    localStorage.setItem("scoped-theme", newTheme);
  }, []);

  const isDark = React.useMemo(() => {
    if (!mounted) return false;
    if (theme === "system") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return theme === "dark";
  }, [theme, mounted]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <div className={`${isDark ? "dark" : ""} contents`}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return React.useContext(ThemeContext);
}
