"use client";

import { useState, useEffect, useCallback } from "react";

export interface AppSettings {
  theme: "light" | "dark";
  fontSize: "sm" | "md" | "lg";
  showDeleted: boolean;
  articleExpanded: boolean;
  notificationsEnabled: boolean;
  pollInterval: 30 | 60 | 300;
  favoritesSort: "recent" | "name";
  myJobField: string[];
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: "light",
  fontSize: "md",
  showDeleted: false,
  articleExpanded: false,
  notificationsEnabled: true,
  pollInterval: 30,
  favoritesSort: "recent",
  myJobField: [],
};

const STORAGE_KEY = "survey-law-settings";

function loadSettings(): AppSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveSettings(settings: AppSettings) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [mounted, setMounted] = useState(false);

  // 클라이언트 마운트 후 localStorage에서 로드
  useEffect(() => {
    setSettings(loadSettings());
    setMounted(true);
  }, []);

  const updateSetting = useCallback(
    <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
      setSettings((prev) => {
        const next = { ...prev, [key]: value };
        saveSettings(next);
        return next;
      });
    },
    []
  );

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    saveSettings(DEFAULT_SETTINGS);
  }, []);

  return { settings, updateSetting, resetSettings, mounted };
}
