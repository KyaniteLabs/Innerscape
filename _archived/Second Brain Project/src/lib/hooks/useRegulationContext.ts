"use client";

import { useState, useEffect, useCallback } from "react";
import { CONFIG } from "@/lib/config";

export type TimeOfDay = "morning" | "afternoon" | "evening" | "night";
export type CategoryId = "appetizers" | "entrees" | "sides" | "desserts";

interface RegulationContext {
    timeOfDay: TimeOfDay;
    hourOfDay: number;
    sessionDuration: number; // minutes since page load
    recentlyUsed: string[]; // item names used recently
    recommendedCategories: CategoryId[];
}

const STORAGE_KEY = "neurosecond-regulation-history";
const SESSION_START_KEY = "neurosecond-session-start";

/**
 * Get time of day category based on current hour
 */
function getTimeOfDay(hour: number): TimeOfDay {
    if (hour >= 5 && hour < 12) return "morning";
    if (hour >= 12 && hour < 17) return "afternoon";
    if (hour >= 17 && hour < 21) return "evening";
    return "night";
}

/**
 * Get recommended categories based on time of day
 * Morning: Warm Up emphasis
 * Afternoon: Deep Work emphasis  
 * Evening: Rest & Support emphasis
 * Night: Rest emphasis
 */
function getRecommendedCategories(timeOfDay: TimeOfDay, sessionMinutes: number): CategoryId[] {
    // If user has been active 2+ hours, always suggest rest
    if (sessionMinutes >= 120) {
        return ["desserts", "sides"];
    }

    switch (timeOfDay) {
        case "morning":
            return ["appetizers", "entrees"]; // Warm up, then deep work
        case "afternoon":
            return ["entrees", "sides"]; // Deep work with support
        case "evening":
            return ["desserts", "sides"]; // Rest and support
        case "night":
            return ["desserts", "appetizers"]; // Rest, gentle wind-down
        default:
            return ["appetizers", "entrees"];
    }
}

/**
 * Score an item based on context factors
 * Higher score = more recommended right now
 */
export function scoreItem(
    itemName: string,
    categoryId: CategoryId,
    context: RegulationContext
): number {
    let score = 50; // Base score

    // Boost if category matches time-of-day recommendation
    const categoryIndex = context.recommendedCategories.indexOf(categoryId);
    if (categoryIndex === 0) {
        score += 30; // Top recommended category
    } else if (categoryIndex === 1) {
        score += 15; // Second recommended
    }

    // Penalize if recently used (don't show same item twice in a row)
    const recentIndex = context.recentlyUsed.indexOf(itemName);
    if (recentIndex === 0) {
        score -= 40; // Just used
    } else if (recentIndex === 1) {
        score -= 20; // Used before last
    } else if (recentIndex >= 0) {
        score -= 10; // Used recently
    }

    // Time-specific item boosts
    const hour = context.hourOfDay;
    
    // Morning boosts
    if (hour >= 5 && hour < 10) {
        if (itemName.toLowerCase().includes("hydration")) score += 15;
        if (itemName.toLowerCase().includes("movement")) score += 10;
    }
    
    // Late afternoon/evening boosts
    if (hour >= 17 && hour < 21) {
        if (itemName.toLowerCase().includes("rest")) score += 10;
        if (itemName.toLowerCase().includes("visual")) score += 10;
    }

    // Long session boosts
    if (context.sessionDuration >= 60) {
        if (itemName.toLowerCase().includes("rest")) score += 15;
        if (itemName.toLowerCase().includes("play")) score += 10;
        if (itemName.toLowerCase().includes("hydration")) score += 10;
    }

    return Math.max(0, Math.min(100, score)); // Clamp 0-100
}

/**
 * Hook for regulation context signals
 * Provides time-aware recommendations and tracks usage history
 */
export function useRegulationContext() {
    const [context, setContext] = useState<RegulationContext>(() => {
        const hour = new Date().getHours();
        const timeOfDay = getTimeOfDay(hour);
        return {
            timeOfDay,
            hourOfDay: hour,
            sessionDuration: 0,
            recentlyUsed: [],
            recommendedCategories: getRecommendedCategories(timeOfDay, 0),
        };
    });

    // Load recently used from localStorage
    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                setContext(prev => ({ ...prev, recentlyUsed: parsed.slice(0, 10) }));
            }
        } catch (err) {
            console.error("[APEX] Failed to parse regulation history:", err);
        }

        // Track session start
        const sessionStart = sessionStorage.getItem(SESSION_START_KEY);
        if (!sessionStart) {
            sessionStorage.setItem(SESSION_START_KEY, Date.now().toString());
        }
    }, []);

    // Update time context every minute
    useEffect(() => {
        const updateContext = () => {
            const hour = new Date().getHours();
            const timeOfDay = getTimeOfDay(hour);
            
            // Calculate session duration
            const sessionStart = sessionStorage.getItem(SESSION_START_KEY);
            let sessionMinutes = 0;
            if (sessionStart) {
                const startTs = parseInt(sessionStart);
                if (!isNaN(startTs)) {
                    sessionMinutes = Math.max(0, Math.floor((Date.now() - startTs) / CONFIG.UI.MINUTE_MS));
                }
            }

            setContext(prev => ({
                ...prev,
                timeOfDay,
                hourOfDay: hour,
                sessionDuration: sessionMinutes,
                recommendedCategories: getRecommendedCategories(timeOfDay, sessionMinutes),
            }));
        };

        updateContext();
        const interval = setInterval(updateContext, 60000); // Every minute

        // Also update on window focus
        const handleFocus = () => updateContext();
        window.addEventListener("focus", handleFocus);

        return () => {
            clearInterval(interval);
            window.removeEventListener("focus", handleFocus);
        };
    }, []);

    // Track item usage
    const trackItemUsed = useCallback((itemName: string) => {
        setContext(prev => {
            // Add to front, remove duplicates, keep last 10
            const newRecent = [
                itemName,
                ...prev.recentlyUsed.filter(name => name !== itemName)
            ].slice(0, 10);

            // Persist to localStorage
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(newRecent));
            } catch {
                // Ignore storage errors
            }

            return { ...prev, recentlyUsed: newRecent };
        });
    }, []);

    // Get time-based greeting
    const getGreeting = useCallback((): string => {
        switch (context.timeOfDay) {
            case "morning":
                return "Good morning! Time to warm up.";
            case "afternoon":
                return "Good afternoon! Ready for deep work?";
            case "evening":
                return "Good evening! Time to wind down.";
            case "night":
                return "It's late. Remember to rest.";
        }
    }, [context.timeOfDay]);

    return {
        ...context,
        trackItemUsed,
        getGreeting,
        scoreItem: (itemName: string, categoryId: CategoryId) => 
            scoreItem(itemName, categoryId, context),
    };
}
