"use client";

import { createContext, useContext, useEffect } from "react";
import { useSettings, type AppSettings, DEFAULT_SETTINGS } from "@/lib/hooks/useSettings";

interface SettingsContextValue {
  settings: AppSettings;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  resetSettings: () => void;
  mounted: boolean;
}

const SettingsContext = createContext<SettingsContextValue>({
  settings: DEFAULT_SETTINGS,
  updateSetting: () => {},
  resetSettings: () => {},
  mounted: false,
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { settings, updateSetting, resetSettings, mounted } = useSettings();

  // 다크모드 토글: <html> 클래스 변경
  useEffect(() => {
    if (!mounted) return;
    const html = document.documentElement;
    if (settings.theme === "dark") {
      html.classList.add("dark");
      html.style.colorScheme = "dark";
    } else {
      html.classList.remove("dark");
      html.style.colorScheme = "light";
    }
  }, [settings.theme, mounted]);

  // 폰트 크기: <html> data-font 속성
  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute("data-font", settings.fontSize);
  }, [settings.fontSize, mounted]);

  return (
    <SettingsContext.Provider value={{ settings, updateSetting, resetSettings, mounted }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettingsContext() {
  return useContext(SettingsContext);
}
