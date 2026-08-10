import { createContext, useContext } from "react";

export type Theme = "light" | "dark";

const ThemeContext = createContext<Theme>("light");

export const ThemeProvider = ThemeContext.Provider;

/**
 * The one piece of state a presentational component may read directly.
 * Everything else reaches views through a ViewModel.
 */
export const useTheme = (): Theme => useContext(ThemeContext);
