"use client";

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Check, Moon, Sparkle, RefreshCw, Globe, Clock, Eye, Inbox, Activity, ChevronDown, ChevronUp } from "lucide-react";
import { useTimeContext } from "@/lib/hooks/useAppContext";
import { CONFIG } from "@/lib/config";

interface ShutdownStep {
    id: string;
    label: string;
    sub: string;
    source?: "base" | "web" | "dynamic";
    details?: string[];
}

interface DynamicTechnique {
    name: string;
    duration: string;
    instructions: string[];
    tip?: string;
    source: "base" | "web";
    fetchedAt: string;
    category?: string;
}

interface PendingTask {
    id: string;
    name: string;
    dueDate: string | null;
}

// Base shutdown steps
const BASE_SHUTDOWN_STEPS: ShutdownStep[] = [
    { id: "tabs", label: "Close browser tabs", sub: "Clear digital clutter", source: "base" },
    { id: "tasks", label: "Review open tasks", sub: "Update task status", source: "base" },
    { id: "highlight", label: "Plan tomorrow", sub: "Set primary focus", source: "base" },
    { id: "desk", label: "Reset workspace", sub: "Physical environment", source: "base" },
];

export function ShutdownRitual() {
    const { isEvening, hourOfDay, isLateNight } = useTimeContext();
    const [completed, setCompleted] = useState<string[]>([]);
    const [isExpanded, setIsExpanded] = useState(true);
    const [dynamicTechniques, setDynamicTechniques] = useState<DynamicTechnique[]>([]);
    const [pendingTasks, setPendingTasks] = useState<PendingTask[]>([]);
    const [sessionMinutes, setSessionMinutes] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Load completed steps from localStorage
    useEffect(() => {
        const today = new Date().toDateString();
        const saved = localStorage.getItem("neurosecond-winddown-completed");
        if (saved) {
            try {
                const { date, steps } = JSON.parse(saved);
                if (date === today) {
                    setCompleted(steps);
                }
            } catch (err) {
                console.error("[APEX] Failed to parse winddown completed steps:", err);
            }
        }

        // Get session duration
        const sessionStart = sessionStorage.getItem("neurosecond-session-start");
        if (sessionStart) {
            const startTs = parseInt(sessionStart);
            if (!isNaN(startTs)) {
                const minutes = Math.floor((Date.now() - startTs) / CONFIG.UI.SHUTDOWN.MINUTE_MS);
                setSessionMinutes(Math.max(0, minutes));
            }
        }
    }, []);

    // Save completed steps
    useEffect(() => {
        const today = new Date().toDateString();
        localStorage.setItem("neurosecond-winddown-completed", JSON.stringify({
            date: today,
            steps: completed,
        }));
    }, [completed]);

    // Fetch dynamic winddown techniques
    const fetchDynamicContent = useCallback(async (force = false) => {
        try {
            setIsRefreshing(true);
            const checkRes = await fetch("/api/content/refresh?type=winddown");
            const checkData = await checkRes.json();
            
            if (checkData.success && checkData.winddown) {
                setDynamicTechniques(checkData.winddown.techniques || []);
                
                if (force || checkData.winddown.isStale) {
                    const refreshRes = await fetch("/api/content/refresh?type=winddown", {
                        method: "POST",
                    });
                    const refreshData = await refreshRes.json();
                    
                    if (refreshData.success && refreshData.winddown?.techniques) {
                        setDynamicTechniques(refreshData.winddown.techniques);
                    }
                }
            }
        } catch (error) {
            console.error("[ShutdownRitual] Failed to fetch dynamic content:", error);
        } finally {
            setIsRefreshing(false);
        }
    }, []);

    // Fetch pending tasks for tomorrow planning
    const fetchPendingTasks = useCallback(async () => {
        try {
            const res = await fetch("/api/tasks?status=todo&limit=3");
            if (res.ok) {
                const data = await res.json();
                setPendingTasks(data.tasks || []);
            }
        } catch (error) {
            console.error("[ShutdownRitual] Failed to fetch tasks:", error);
        }
    }, []);

    useEffect(() => {
        if (isEvening) {
            fetchDynamicContent();
            fetchPendingTasks();
        }
    }, [isEvening, fetchDynamicContent, fetchPendingTasks]);

    // Build dynamic steps based on context
    const shutdownSteps = useMemo(() => {
        const steps: ShutdownStep[] = [...BASE_SHUTDOWN_STEPS];

        // Add context-aware steps
        if (sessionMinutes >= 120) {
            // Long session - add eye rest
            steps.splice(1, 0, {
                id: "eyerest",
                label: "Rest your eyes",
                sub: `${Math.floor(sessionMinutes / 60)}+ hours of screen time`,
                source: "dynamic",
                details: [
                    "Look at something 20+ feet away for 20 seconds",
                    "Close eyes and gently massage temples",
                    "Cup hands over closed eyes for 1 minute of darkness",
                ],
            });
        }

        // Add stretch if long session and no movement
        if (sessionMinutes >= 90) {
            steps.splice(2, 0, {
                id: "stretch",
                label: "Quick stretch",
                sub: "Release tension from sitting",
                source: "dynamic",
                details: [
                    "Stand up and shake out your limbs",
                    "Reach arms overhead, then touch toes",
                    "Roll shoulders and neck gently",
                ],
            });
        }

        // Enhance "Plan tomorrow" step with pending tasks
        if (pendingTasks.length > 0) {
            const planStep = steps.find(s => s.id === "highlight");
            if (planStep) {
                planStep.details = [
                    "Top tasks for tomorrow:",
                    ...pendingTasks.map(t => `• ${t.name}`),
                    "Pick ONE as your primary focus",
                ];
            }
        }

        // Add dynamic web techniques (max 2)
        const relevantTechniques = dynamicTechniques
            .filter(t => t.category === "transition" || t.category === "relax")
            .slice(0, 2);

        relevantTechniques.forEach((tech, index) => {
            steps.push({
                id: `web-${index}`,
                label: tech.name,
                sub: tech.duration,
                source: "web",
                details: tech.instructions,
            });
        });

        return steps;
    }, [sessionMinutes, pendingTasks, dynamicTechniques]);

    const toggle = (id: string) => {
        setCompleted(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const progress = shutdownSteps.length > 0 
        ? (completed.length / shutdownSteps.length) * 100 
        : 0;
    const isComplete = shutdownSteps.length > 0 && completed.length === shutdownSteps.length;

    // Track completion in analytics
    useEffect(() => {
        if (isComplete) {
            const now = Date.now();
            try {
                const saved = localStorage.getItem("neurosecond-winddown-history");
                const history = saved ? JSON.parse(saved) : [];
                const newHistory = [now, ...history].slice(0, CONFIG.UI.SHUTDOWN.HISTORY_LIMIT);
                localStorage.setItem("neurosecond-winddown-history", JSON.stringify(newHistory));
            } catch (err) {
                console.error("[APEX] Failed to save winddown history:", err);
            }
        }
    }, [isComplete]);

    // Don't show before 5 PM (but show collapsed indicator)
    if (!isEvening) {
        return (
            <div className="card opacity-60" style={{ padding: '12px' }}>
                <div className="flex items-center gap-2 text-muted">
                    <Moon size={16} />
                    <span className="text-xs">Wind Down available after 5 PM</span>
                    <Clock size={12} className="ml-auto" />
                    <span className="text-xs font-mono">{hourOfDay}:00</span>
                </div>
            </div>
        );
    }

    return (
        <div className="card stack-sm">
            {/* Header */}
            <div className="flex items-center justify-between">
                <button 
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center gap-2 flex-1 text-left"
                >
                    <div className="icon-box icon-box-sm badge-accent">
                        <Moon size={16} />
                    </div>
                    <div>
                        <h2 className="font-semibold text-sm">Wind Down</h2>
                        <p className="text-xs text-muted">
                            {isLateNight ? "It's late - time to rest!" : "End-of-day ritual"}
                        </p>
                    </div>
                </button>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-medium" style={{ color: isComplete ? 'var(--accent)' : 'var(--text-muted)' }}>
                        {completed.length}/{shutdownSteps.length}
                    </span>
                    <button
                        onClick={() => fetchDynamicContent(true)}
                        disabled={isRefreshing}
                        className="btn btn-ghost p-1.5 text-muted hover:text-primary"
                        title="Refresh techniques"
                    >
                        <RefreshCw size={12} className={isRefreshing ? "animate-spin" : ""} />
                    </button>
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="btn btn-ghost p-1.5"
                    >
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>

            {/* Steps */}
            {isExpanded && (
                <div>
                    {shutdownSteps.map((step) => {
                        const isDone = completed.includes(step.id);
                        return (
                            <div key={step.id} className="mb-2">
                                <button
                                    onClick={() => toggle(step.id)}
                                    className="flex items-center gap-3 w-full text-left hover-bg transition rounded-lg p-2 bg-transparent border-none cursor-pointer"
                                >
                                    <div className={`checkbox ${isDone ? 'checked' : ''}`}>
                                        {isDone && <Check size={12} className="text-white" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm flex items-center gap-2" style={{ textDecoration: isDone ? 'line-through' : 'none', color: isDone ? 'var(--text-muted)' : 'var(--text)' }}>
                                            {step.label}
                                            {step.source === "web" && (
                                                <span className="text-[9px] px-1 py-0.5 rounded bg-accent/20 text-accent flex items-center gap-0.5">
                                                    <Globe size={8} />
                                                    New
                                                </span>
                                            )}
                                            {step.source === "dynamic" && (
                                                <span className="text-[9px] px-1 py-0.5 rounded bg-primary/20 text-primary">
                                                    For you
                                                </span>
                                            )}
                                        </p>
                                        <p className="text-xs text-muted opacity-70">
                                            {step.sub}
                                        </p>
                                    </div>
                                </button>
                                
                                {/* Expandable details */}
                                {step.details && !isDone && (
                                    <div className="ml-9 mt-1 mb-2 p-2 bg-elevated/50 rounded-lg">
                                        {step.details.map((detail, i) => (
                                            <p key={i} className="text-xs text-muted">{detail}</p>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Completion Message */}
            {isComplete && (
                <div className="flex items-center justify-center gap-2 badge-accent p-2 rounded-lg border border-accent/30">
                    <Sparkle size={14} className="text-accent" />
                    <p className="text-xs font-medium text-accent">All done! Rest well.</p>
                </div>
            )}

            {/* Late night warning */}
            {isLateNight && !isComplete && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-warning/10 border border-warning/20">
                    <Clock size={14} className="text-warning" />
                    <p className="text-xs text-warning">It&apos;s past 10 PM - try to complete your wind down soon!</p>
                </div>
            )}
        </div>
    );
}
