"use client";

import { useTheme } from "@/lib/hooks/useTheme";
import { Sun, Moon, Monitor } from "lucide-react";

export function ThemeToggle() {
    const { resolvedTheme, toggleTheme, mounted } = useTheme();

    // Don't render anything until mounted to avoid hydration mismatch
    if (!mounted) {
        return (
            <button className="btn btn-ghost w-38 h-38">
                <div className="w-18 h-18" />
            </button>
        );
    }

    return (
        <button
            onClick={toggleTheme}
            className="btn btn-ghost p-2 w-38 h-38"
            title={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
        >
            {resolvedTheme === "dark" ? (
                <Sun size={18} />
            ) : (
                <Moon size={18} />
            )}
        </button>
    );
}

export function ThemeSelector() {
    const { theme, setTheme, mounted } = useTheme();

    if (!mounted) return null;

    return (
        <div className="flex gap-1">
            <button
                onClick={() => setTheme("light")}
                className={`btn p-2 ${theme === "light" ? "btn-primary" : "btn-ghost"}`}
                title="Light mode"
            >
                <Sun size={16} />
            </button>
            <button
                onClick={() => setTheme("dark")}
                className={`btn p-2 ${theme === "dark" ? "btn-primary" : "btn-ghost"}`}
                title="Dark mode"
            >
                <Moon size={16} />
            </button>
            <button
                onClick={() => setTheme("system")}
                className={`btn p-2 ${theme === "system" ? "btn-primary" : "btn-ghost"}`}
                title="System preference"
            >
                <Monitor size={16} />
            </button>
        </div>
    );
}
