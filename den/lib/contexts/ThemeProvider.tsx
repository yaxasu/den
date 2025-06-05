import React, { createContext, useContext, useState, useEffect } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { themes, ThemeType, light } from "../../constants/Colors";

type ThemeName = "light" | "dark" | "system";

interface ThemeContextProps {
  theme: ThemeType;
  themeName: ThemeName;
  isDark: boolean;
  setTheme: (theme: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextProps>({
  theme: light,
  themeName: "light",
  isDark: false,
  setTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemTheme = useColorScheme() || "dark"; // Detect system theme
  // const [themeName, setThemeName] = useState<ThemeName>("system");
  const [themeName, setThemeName] = useState<ThemeName>("dark");

  useEffect(() => {
    const loadTheme = async () => {
      const savedTheme = (await AsyncStorage.getItem("appTheme")) as ThemeName | null;
      if (savedTheme) setThemeName(savedTheme);
    };
    loadTheme();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem("appTheme", themeName);
  }, [themeName]);

  const activeTheme = themeName === "system" ? themes[systemTheme] : themes[themeName];
  const isDark = themeName === "dark" || (themeName === "system" && systemTheme === "dark");

  return (
    <ThemeContext.Provider value={{ theme: activeTheme, themeName, isDark, setTheme: setThemeName }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
