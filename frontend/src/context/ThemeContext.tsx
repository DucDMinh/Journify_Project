"use client";

import type React from "react";
import { createContext, useCallback, useContext, useEffect, useSyncExternalStore } from "react";
import { DARK_QUERY, THEME_STORAGE_KEY } from "./themeScript";

type Theme = "light" | "dark";
export type ThemePreference = Theme | "system";

type ThemeContextType = {
    theme: Theme;
    preference: ThemePreference;
    toggleTheme: () => void;
    setPreference: (preference: ThemePreference) => void;
};

const listeners = new Set<() => void>();

const readPreference = (): ThemePreference => {
    try {
        const stored = localStorage.getItem(THEME_STORAGE_KEY);
        return stored === "dark" || stored === "system" ? stored : "light";
    } catch {
        return "light";
    }
};

const systemPrefersDark = () => typeof window !== "undefined" && window.matchMedia?.(DARK_QUERY).matches === true;

const readTheme = (): Theme => {
    const preference = readPreference();
    if (preference === "system") return systemPrefersDark() ? "dark" : "light";
    return preference;
};

const writePreference = (preference: ThemePreference) => {
    try {
        localStorage.setItem(THEME_STORAGE_KEY, preference);
    } catch {
        return;
    }
    listeners.forEach((listener) => listener());
};

const subscribe = (listener: () => void) => {
    listeners.add(listener);
    const media = window.matchMedia?.(DARK_QUERY);
    window.addEventListener("storage", listener);
    media?.addEventListener("change", listener);
    return () => {
        listeners.delete(listener);
        window.removeEventListener("storage", listener);
        media?.removeEventListener("change", listener);
    };
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const theme = useSyncExternalStore(subscribe, readTheme, () => "light" as Theme);
    const preference = useSyncExternalStore(subscribe, readPreference, () => "light" as ThemePreference);

    useEffect(() => {
        document.documentElement.classList.toggle("dark", theme === "dark");
        document.documentElement.classList.toggle("theme-night", theme === "dark");
    }, [theme]);

    const toggleTheme = useCallback(() => {
        writePreference(readTheme() === "light" ? "dark" : "light");
    }, []);

    const setPreference = useCallback((next: ThemePreference) => writePreference(next), []);

    return <ThemeContext.Provider value={{ theme, preference, toggleTheme, setPreference }}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
};
