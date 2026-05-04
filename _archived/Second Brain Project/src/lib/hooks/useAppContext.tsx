"use client";

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from "react";
import { CONFIG } from "@/lib/config";

// ===== Types =====

export type TimeOfDay = "morning" | "afternoon" | "evening" | "night";

export interface CaptureStats {
    todayCount: number;
    lastHourCount: number;
    byType: {
        projects: number;
        people: number;
        ideas: number;
        admin: number;
        needsReview: number;
    };
    voiceVsText: {
        voice: number;
        text: number;
    };
    lastCaptureAt: string | null;
}

export interface ActivityPattern {
    peakHours: number[]; // Top 3 most active hours
    averagePerDay: number;
    trend: "up" | "down" | "stable";
    totalThisWeek: number;
}

export interface RegulationStats {
    lastWinddownAt: string | null;
    winddownCompletionsThisWeek: number;
    recentlyUsedTechniques: string[];
    sessionMinutes: number;
}

export interface AppContextValue {
    // Time context
    timeOfDay: TimeOfDay;
    hourOfDay: number;
    isEvening: boolean; // After 5 PM
    isLateNight: boolean; // After 10 PM
    
    // Session context
    sessionDuration: number; // Minutes since page load
    sessionStart: Date;
    
    // Capture context
    captureStats: CaptureStats;
    activityPattern: ActivityPattern;
    
    // Regulation context
    regulationStats: RegulationStats;
    recentlyUsedItems: string[];
    
    // System stats (from /api/stats)
    systemStats: {
        projects: { total: number; active: number };
        people: { total: number };
        ideas: { total: number };
        admin: { total: number; pending: number };
        inbox: { pending: number; needsReview: number; totalCaptured: number };
    } | null;
    
    // Methods
    trackRegulationUsed: (itemName: string) => void;
    trackWinddownComplete: () => void;
    refreshStats: () => Promise<void>;
    getGreeting: () => string;
    getCapturePlaceholder: () => string;
    getSuggestedQuestions: () => string[];
}

// ===== Constants =====

const SESSION_START_KEY = "neurosecond-session-start";
const REGULATION_HISTORY_KEY = "neurosecond-regulation-history";
const WINDDOWN_HISTORY_KEY = "neurosecond-winddown-history";

// ===== Helper Functions =====

function getTimeOfDay(hour: number): TimeOfDay {
    if (hour >= 5 && hour < 12) return "morning";
    if (hour >= 12 && hour < 17) return "afternoon";
    if (hour >= 17 && hour < 21) return "evening";
    return "night";
}

function getGreetingForTime(timeOfDay: TimeOfDay, sessionMinutes: number): string {
    if (sessionMinutes >= 120) {
        return "You've been at it for a while. Consider a break!";
    }
    
    switch (timeOfDay) {
        case "morning":
            return "Good morning! Ready to capture your thoughts?";
        case "afternoon":
            return "Good afternoon! How's your focus?";
        case "evening":
            return "Good evening! Time to wind down.";
        case "night":
            return "It's late. Don't forget to rest!";
    }
}

function getPlaceholderForTime(timeOfDay: TimeOfDay, lastCaptureMinutesAgo: number | null): string {
    // If it's been a while since last capture
    if (lastCaptureMinutesAgo && lastCaptureMinutesAgo > 60) {
        return "Been a while! Quick brain dump?";
    }
    
    switch (timeOfDay) {
        case "morning":
            return "What's on your mind this morning?";
        case "afternoon":
            return "Capture a thought or task...";
        case "evening":
            return "Anything to wrap up today?";
        case "night":
            return "One last thought before rest?";
    }
}

function getSuggestionsForContext(
    timeOfDay: TimeOfDay, 
    captureStats: CaptureStats,
    systemStats: AppContextValue["systemStats"]
): string[] {
    const suggestions: string[] = [];
    
    // Time-based suggestions
    switch (timeOfDay) {
        case "morning":
            suggestions.push("What should I focus on today?");
            suggestions.push("What's in my inbox?");
            break;
        case "afternoon":
            suggestions.push("How many tasks have I captured?");
            suggestions.push("Show me my active projects");
            break;
        case "evening":
            suggestions.push("Summarize what I captured today");
            suggestions.push("What should I review?");
            break;
        case "night":
            suggestions.push("What's pending for tomorrow?");
            break;
    }
    
    // Context-based suggestions
    if (captureStats.todayCount > 0) {
        suggestions.push("What did I just add?");
    }
    
    if (systemStats?.inbox.needsReview && systemStats.inbox.needsReview > 0) {
        suggestions.push(`Review my ${systemStats.inbox.needsReview} pending items`);
    }
    
    // Analytics suggestions
    suggestions.push("When am I most productive?");
    suggestions.push("How am I doing this week?");
    
    return suggestions.slice(0, 4); // Max 4 suggestions
}

// ===== Default Values =====

const defaultCaptureStats: CaptureStats = {
    todayCount: 0,
    lastHourCount: 0,
    byType: { projects: 0, people: 0, ideas: 0, admin: 0, needsReview: 0 },
    voiceVsText: { voice: 0, text: 0 },
    lastCaptureAt: null,
};

const defaultActivityPattern: ActivityPattern = {
    peakHours: [9, 14, 16],
    averagePerDay: 0,
    trend: "stable",
    totalThisWeek: 0,
};

const defaultRegulationStats: RegulationStats = {
    lastWinddownAt: null,
    winddownCompletionsThisWeek: 0,
    recentlyUsedTechniques: [],
    sessionMinutes: 0,
};

// ===== Context =====

const AppContext = createContext<AppContextValue | null>(null);

// ===== Provider Component =====

export function AppContextProvider({ children }: { children: ReactNode }) {
    const [hourOfDay, setHourOfDay] = useState(() => new Date().getHours());
    const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(() => getTimeOfDay(new Date().getHours()));
    const [sessionStart] = useState(() => new Date());
    const [sessionDuration, setSessionDuration] = useState(0);
    
    const [captureStats, setCaptureStats] = useState<CaptureStats>(defaultCaptureStats);
    const [activityPattern, setActivityPattern] = useState<ActivityPattern>(defaultActivityPattern);
    const [regulationStats, setRegulationStats] = useState<RegulationStats>(defaultRegulationStats);
    const [recentlyUsedItems, setRecentlyUsedItems] = useState<string[]>([]);
    const [systemStats, setSystemStats] = useState<AppContextValue["systemStats"]>(null);

    // Load persisted data on mount
    useEffect(() => {
        // Load recently used regulation items
        try {
            const saved = localStorage.getItem(REGULATION_HISTORY_KEY);
            if (saved) {
                setRecentlyUsedItems(JSON.parse(saved).slice(0, 10));
            }
        } catch { /* ignore */ }

        // Load winddown history
        try {
            const saved = localStorage.getItem(WINDDOWN_HISTORY_KEY);
            if (saved) {
                const history = JSON.parse(saved);
                const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
                const thisWeek = history.filter((ts: number) => ts > weekAgo);
                setRegulationStats(prev => ({
                    ...prev,
                    lastWinddownAt: history[0] ? new Date(history[0]).toISOString() : null,
                    winddownCompletionsThisWeek: thisWeek.length,
                }));
            }
        } catch { /* ignore */ }

        // Track session start
        sessionStorage.setItem(SESSION_START_KEY, Date.now().toString());
    }, []);

    // Update time context every minute
    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            const hour = now.getHours();
            setHourOfDay(hour);
            setTimeOfDay(getTimeOfDay(hour));
            
            // Update session duration
            const sessionStartTime = sessionStorage.getItem(SESSION_START_KEY);
            if (sessionStartTime) {
                const minutes = Math.floor((Date.now() - parseInt(sessionStartTime)) / 60000);
                setSessionDuration(minutes);
                setRegulationStats(prev => ({ ...prev, sessionMinutes: minutes }));
            }
        };

        updateTime();
        const interval = setInterval(updateTime, 60000);
        
        // Also update on focus
        const handleFocus = () => updateTime();
        window.addEventListener("focus", handleFocus);

        return () => {
            clearInterval(interval);
            window.removeEventListener("focus", handleFocus);
        };
    }, []);

    // Fetch system stats periodically
    const refreshStats = useCallback(async () => {
        try {
            const [statsRes, captureRes] = await Promise.all([
                fetch("/api/stats"),
                fetch("/api/analytics/captures?period=today"),
            ]);

            if (statsRes.ok) {
                const statsData = await statsRes.json();
                if (statsData.success) {
                    setSystemStats(statsData.stats);
                }
            }

            if (captureRes.ok) {
                const captureData = await captureRes.json();
                if (captureData.success) {
                    setCaptureStats(captureData.stats || defaultCaptureStats);
                    if (captureData.pattern) {
                        setActivityPattern(captureData.pattern);
                    }
                }
            }
        } catch (err) {
            console.error("[AppContext] Failed to refresh stats:", err);
        }
    }, []);

    // Initial fetch and periodic refresh
    useEffect(() => {
        refreshStats();
        const interval = setInterval(refreshStats, CONFIG.UI.STATS.REFRESH_INTERVAL_MS);
        return () => clearInterval(interval);
    }, [refreshStats]);

    // Track regulation item usage
    const trackRegulationUsed = useCallback((itemName: string) => {
        setRecentlyUsedItems(prev => {
            const newList = [itemName, ...prev.filter(n => n !== itemName)].slice(0, 10);
            try {
                localStorage.setItem(REGULATION_HISTORY_KEY, JSON.stringify(newList));
            } catch { /* ignore */ }
            return newList;
        });

        setRegulationStats(prev => ({
            ...prev,
            recentlyUsedTechniques: [itemName, ...prev.recentlyUsedTechniques.filter(n => n !== itemName)].slice(0, 5),
        }));
    }, []);

    // Track winddown completion
    const trackWinddownComplete = useCallback(() => {
        const now = Date.now();
        
        try {
            const saved = localStorage.getItem(WINDDOWN_HISTORY_KEY);
            const history = saved ? JSON.parse(saved) : [];
            const newHistory = [now, ...history].slice(0, 30); // Keep last 30
            localStorage.setItem(WINDDOWN_HISTORY_KEY, JSON.stringify(newHistory));
            
            const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
            const thisWeek = newHistory.filter((ts: number) => ts > weekAgo);
            
            setRegulationStats(prev => ({
                ...prev,
                lastWinddownAt: new Date(now).toISOString(),
                winddownCompletionsThisWeek: thisWeek.length,
            }));
        } catch { /* ignore */ }
    }, []);

    // Derived getters
    const getGreeting = useCallback(() => {
        return getGreetingForTime(timeOfDay, sessionDuration);
    }, [timeOfDay, sessionDuration]);

    const getCapturePlaceholder = useCallback(() => {
        const lastCaptureAt = captureStats.lastCaptureAt;
        const lastCaptureMinutesAgo = lastCaptureAt
            ? Math.floor((Date.now() - new Date(lastCaptureAt).getTime()) / 60000)
            : null;
        return getPlaceholderForTime(timeOfDay, lastCaptureMinutesAgo);
    }, [timeOfDay, captureStats.lastCaptureAt]);

    const getSuggestedQuestions = useCallback(() => {
        return getSuggestionsForContext(timeOfDay, captureStats, systemStats);
    }, [timeOfDay, captureStats, systemStats]);

    const value: AppContextValue = {
        timeOfDay,
        hourOfDay,
        isEvening: hourOfDay >= 17,
        isLateNight: hourOfDay >= 22 || hourOfDay < 5,
        sessionDuration,
        sessionStart,
        captureStats,
        activityPattern,
        regulationStats,
        recentlyUsedItems,
        systemStats,
        trackRegulationUsed,
        trackWinddownComplete,
        refreshStats,
        getGreeting,
        getCapturePlaceholder,
        getSuggestedQuestions,
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
}

// ===== Hook =====

export function useAppContext(): AppContextValue {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error("useAppContext must be used within AppContextProvider");
    }
    return context;
}

// ===== Standalone Hook (for components that don't need full context) =====

export function useTimeContext() {
    const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(() => getTimeOfDay(new Date().getHours()));
    const [hourOfDay, setHourOfDay] = useState(() => new Date().getHours());

    useEffect(() => {
        const update = () => {
            const hour = new Date().getHours();
            setHourOfDay(hour);
            setTimeOfDay(getTimeOfDay(hour));
        };
        
        const interval = setInterval(update, 60000);
        window.addEventListener("focus", update);
        
        return () => {
            clearInterval(interval);
            window.removeEventListener("focus", update);
        };
    }, []);

    return {
        timeOfDay,
        hourOfDay,
        isEvening: hourOfDay >= 17,
        isLateNight: hourOfDay >= 22 || hourOfDay < 5,
        isMorning: hourOfDay >= 5 && hourOfDay < 12,
    };
}
