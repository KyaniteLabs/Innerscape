"use client";

import { useState, useEffect, useCallback } from "react";

export type Theme = "dark" | "light" | "system";

const STORAGE_KEY = "neurosecond-theme";

function getSystemTheme(): "dark" | "light" {
    if (typeof window === "undefined") return "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getStoredTheme(): Theme {
    if (typeof window === "undefined") return "system";
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "dark" || stored === "light" || stored === "system") {
        return stored;
    }
    return "system";
}

export function useTheme() {
    const [theme, setThemeState] = useState<Theme>("system");
    const [resolvedTheme, setResolvedTheme] = useState<"dark" | "light">("dark");
    const [mounted, setMounted] = useState(false);

    // Initialize theme from storage
    useEffect(() => {
        const stored = getStoredTheme();
        setThemeState(stored);
        setResolvedTheme(stored === "system" ? getSystemTheme() : stored);
        setMounted(true);
    }, []);

    // Apply theme to document
    useEffect(() => {
        if (!mounted) return;

        const resolved = theme === "system" ? getSystemTheme() : theme;
        setResolvedTheme(resolved);
        
        document.documentElement.setAttribute("data-theme", resolved);
    }, [theme, mounted]);

    // Listen for system theme changes
    useEffect(() => {
        if (theme !== "system") return;

        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        const handleChange = () => {
            setResolvedTheme(getSystemTheme());
            document.documentElement.setAttribute("data-theme", getSystemTheme());
        };

        mediaQuery.addEventListener("change", handleChange);
        return () => mediaQuery.removeEventListener("change", handleChange);
    }, [theme]);

    const setTheme = useCallback((newTheme: Theme) => {
        setThemeState(newTheme);
        localStorage.setItem(STORAGE_KEY, newTheme);
    }, []);

    const toggleTheme = useCallback(() => {
        const next = resolvedTheme === "dark" ? "light" : "dark";
        setTheme(next);
    }, [resolvedTheme, setTheme]);

    return {
        theme,
        resolvedTheme,
        setTheme,
        toggleTheme,
        mounted,
    };
}
