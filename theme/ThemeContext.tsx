// theme/ThemeContext.tsx
import React, { createContext, useContext } from "react";
import { useColorScheme } from "react-native";

const light = {
  background: "#f6f8f6",
  card: "#ffffff",
  primary: "#17cf17",
  text: "#0f1a0f",
  muted: "#6b6f6b",
};

const dark = {
  background: "#0e1a12",
  card: "#10210f",
  primary: "#00e060",
  text: "#e6f6e6",
  muted: "#9aa19a",
};

type Theme = typeof light;

const ThemeContext = createContext<Theme>(light);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const scheme = useColorScheme();
  const theme: Theme = scheme === "dark" ? dark : light;
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
