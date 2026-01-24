"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Coffee, Activity, Heart, Star, Sparkles, ChevronRight, X, Clock, Sunrise, Sun, Sunset, Moon, Zap, RefreshCw, Globe } from "lucide-react";
import { useRegulationContext, type CategoryId } from "@/lib/hooks/useRegulationContext";

interface RegulationItem {
    name: string;
    duration: string;
    instructions: string[];
    tip?: string;
    source?: "base" | "web";
    fetchedAt?: string;
}

interface RegulationSection {
    id: string;
    category: string;
    icon: React.ReactNode;
    color: string;
    colorRgb: string;
    description: string;
    items: RegulationItem[];
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

const DOPAMINE_MENU: RegulationSection[] = [
    {
        id: "appetizers",
        category: "Warm Up",
        icon: <Coffee size={16} />,
        color: "var(--success)",
        colorRgb: "var(--success-rgb)",
        description: "Gentle activation to ease into focus",
        items: [
            {
                name: "Pet the dog",
                duration: "2-5 min",
                instructions: [
                    "Find your pet (or a soft pillow/blanket)",
                    "Sit or lie down in a comfortable position",
                    "Focus on the texture under your hands",
                    "Match your breathing to slow, gentle strokes",
                    "Notice the warmth and softness"
                ],
                tip: "No pet? A weighted blanket or soft fabric works too"
            },
            {
                name: "Gentle movement",
                duration: "3-5 min",
                instructions: [
                    "Stand up and shake out your hands",
                    "Roll your shoulders backward 5 times",
                    "Roll your neck gently side to side",
                    "Stretch arms overhead, then down to touch toes",
                    "Do 5 slow squats or march in place"
                ],
                tip: "Movement doesn't need to be intense to activate your brain"
            },
            {
                name: "Hydration",
                duration: "1 min",
                instructions: [
                    "Get a full glass of water (room temp or cold)",
                    "Take 3 deep breaths before drinking",
                    "Drink slowly, feeling the water go down",
                    "Notice how your body feels after",
                    "Set the glass somewhere visible as a reminder"
                ],
                tip: "Dehydration mimics ADHD symptoms - always hydrate first"
            },
            {
                name: "Mirror work",
                duration: "2 min",
                instructions: [
                    "Stand in front of a mirror",
                    "Make eye contact with yourself",
                    "Say one kind thing about yourself out loud",
                    "Smile at yourself (even if it feels silly)",
                    "Take 3 deep breaths while maintaining eye contact"
                ],
                tip: "This activates your social engagement system and calms anxiety"
            }
        ]
    },
    {
        id: "entrees",
        category: "Deep Work",
        icon: <Activity size={16} />,
        color: "var(--primary)",
        colorRgb: "var(--primary-rgb)",
        description: "Structured focus techniques",
        items: [
            {
                name: "Deep focus",
                duration: "25-50 min",
                instructions: [
                    "Choose ONE task to focus on",
                    "Set a timer for 25 minutes (Pomodoro)",
                    "Put phone in another room or on airplane mode",
                    "Close all tabs except what you need",
                    "Work until the timer rings, then take a 5 min break"
                ],
                tip: "If 25 min feels too long, start with 15. Build up gradually."
            },
            {
                name: "Creative flow",
                duration: "30-60 min",
                instructions: [
                    "Gather your creative tools (paper, instrument, etc)",
                    "Put on instrumental music or white noise",
                    "Start without a goal - just make something",
                    "Don't judge what comes out for the first 10 min",
                    "Follow whatever feels interesting"
                ],
                tip: "Creativity needs safety from judgment. Give yourself permission to make 'bad' things."
            },
            {
                name: "Reading",
                duration: "15-30 min",
                instructions: [
                    "Choose something you WANT to read (not should)",
                    "Find a comfortable position with good lighting",
                    "Set a page goal instead of time goal",
                    "Use a finger or bookmark to guide your eyes",
                    "Take notes or highlight to stay engaged"
                ],
                tip: "Audiobooks count as reading. Use whatever format works for your brain."
            },
            {
                name: "Synthesis",
                duration: "20-30 min",
                instructions: [
                    "Open a blank document or notebook",
                    "Write the question you're trying to answer",
                    "List everything you know about it (brain dump)",
                    "Look for connections between ideas",
                    "Write a one-paragraph summary of your thoughts"
                ],
                tip: "Talking out loud while writing helps many neurodivergent brains"
            }
        ]
    },
    {
        id: "sides",
        category: "Support",
        icon: <Heart size={16} />,
        color: "var(--accent)",
        colorRgb: "var(--accent-rgb)",
        description: "Environmental aids for regulation",
        items: [
            {
                name: "Ambient sounds",
                duration: "Ongoing",
                instructions: [
                    "Open a brown noise or nature sounds app",
                    "Start at low volume",
                    "Adjust until it feels like a 'blanket' for your ears",
                    "Use headphones for better immersion",
                    "Try different sounds (rain, cafe, forest) to find your match"
                ],
                tip: "Brown noise is often better than white noise for ADHD brains"
            },
            {
                name: "Tactile focus",
                duration: "As needed",
                instructions: [
                    "Get a fidget toy, stress ball, or textured object",
                    "Hold it in your non-dominant hand while working",
                    "Focus on the texture and movement",
                    "Switch fidgets if you stop noticing it",
                    "Keep multiple options nearby"
                ],
                tip: "Fidgeting helps your brain regulate - it's not a distraction"
            },
            {
                name: "Aromatherapy",
                duration: "Ongoing",
                instructions: [
                    "Choose a scent (peppermint for focus, lavender for calm)",
                    "Apply to wrists, temples, or use a diffuser",
                    "Take 3 deep breaths to activate the scent",
                    "Re-apply when you notice you've forgotten it",
                    "Create scent associations with specific tasks"
                ],
                tip: "Smell is the fastest sense to affect your emotional state"
            },
            {
                name: "Light sync",
                duration: "Setup once",
                instructions: [
                    "Adjust screen brightness to match room lighting",
                    "Turn on warm/night mode in the evening",
                    "Get natural light when possible",
                    "Use a light therapy lamp in the morning",
                    "Dim overhead lights and use task lighting"
                ],
                tip: "Blue light in the evening disrupts sleep and next-day focus"
            }
        ]
    },
    {
        id: "desserts",
        category: "Rest",
        icon: <Star size={16} />,
        color: "var(--warning)",
        colorRgb: "var(--warning-rgb)",
        description: "Intentional recovery and play",
        items: [
            {
                name: "Digital drift",
                duration: "10-20 min",
                instructions: [
                    "Set a timer (this is key!)",
                    "Open your favorite scroll app guilt-free",
                    "Notice what actually makes you feel good",
                    "When timer rings, take 3 breaths before stopping",
                    "Transition to something physical after"
                ],
                tip: "Scheduled scrolling removes guilt and helps you stop"
            },
            {
                name: "Play",
                duration: "15-30 min",
                instructions: [
                    "Choose something with no productive purpose",
                    "Video games, doodling, building blocks, anything",
                    "Don't try to 'get good' - just play",
                    "Notice what makes you smile or laugh",
                    "Stop before you get frustrated or bored"
                ],
                tip: "Play is how your brain processes and recovers. It's not lazy."
            },
            {
                name: "Visual rest",
                duration: "5-10 min",
                instructions: [
                    "Look away from all screens",
                    "Find something 20+ feet away to focus on",
                    "Let your eyes relax and soften",
                    "Close your eyes and cup hands over them gently",
                    "Stay in darkness for at least 1 minute"
                ],
                tip: "Your eyes need rest too. Screen fatigue affects your whole body."
            }
        ]
    },
];

// Time of day icons
const TIME_ICONS = {
    morning: <Sunrise size={14} />,
    afternoon: <Sun size={14} />,
    evening: <Sunset size={14} />,
    night: <Moon size={14} />,
};

// Category mapping for dynamic techniques
const CATEGORY_TO_SECTION: Record<string, string> = {
    warmup: "appetizers",
    deepwork: "entrees",
    support: "sides",
    rest: "desserts",
};

export function DopamineMenu() {
    const [selectedItem, setSelectedItem] = useState<{
        section: RegulationSection;
        item: RegulationItem;
    } | null>(null);
    const [dynamicTechniques, setDynamicTechniques] = useState<DynamicTechnique[]>([]);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastRefresh, setLastRefresh] = useState<string | null>(null);

    const { 
        timeOfDay, 
        sessionDuration, 
        getGreeting, 
        scoreItem, 
        trackItemUsed,
        recommendedCategories,
        recentlyUsed 
    } = useRegulationContext();

    // Fetch dynamic techniques on mount
    const fetchDynamicContent = useCallback(async (force = false) => {
        try {
            setIsRefreshing(true);
            
            // First, check if we need to refresh
            const checkRes = await fetch("/api/content/refresh?type=regulation");
            const checkData = await checkRes.json();
            
            if (checkData.success && checkData.regulation) {
                setDynamicTechniques(checkData.regulation.techniques || []);
                setLastRefresh(checkData.regulation.lastRefresh);
                
                // If stale or forced, trigger refresh
                if (force || checkData.regulation.isStale) {
                    const refreshRes = await fetch("/api/content/refresh?type=regulation", {
                        method: "POST",
                    });
                    const refreshData = await refreshRes.json();
                    
                    if (refreshData.success && refreshData.regulation?.techniques) {
                        setDynamicTechniques(refreshData.regulation.techniques);
                        setLastRefresh(refreshData.regulation.lastRefresh);
                    }
                }
            }
        } catch (error) {
            console.error("[DopamineMenu] Failed to fetch dynamic content:", error);
        } finally {
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchDynamicContent();
    }, [fetchDynamicContent]);

    // Merge dynamic techniques into the menu
    const enhancedMenu = useMemo((): RegulationSection[] => {
        // Start with base menu
        const menu: RegulationSection[] = DOPAMINE_MENU.map(section => ({
            ...section,
            items: section.items.map((item): RegulationItem => ({ 
                ...item, 
                source: "base" as "base" | "web"
            })),
        }));

        // Add dynamic techniques to appropriate sections
        dynamicTechniques.forEach(technique => {
            const sectionId = technique.category 
                ? CATEGORY_TO_SECTION[technique.category.toLowerCase()] || "appetizers"
                : "appetizers";
            
            const section = menu.find(s => s.id === sectionId);
            if (section) {
                // Check if technique with similar name already exists
                const exists = section.items.some(
                    item => item.name.toLowerCase() === technique.name.toLowerCase()
                );
                
                if (!exists) {
                    const newItem: RegulationItem = {
                        name: technique.name,
                        duration: technique.duration,
                        instructions: technique.instructions,
                        tip: technique.tip,
                        source: "web",
                        fetchedAt: technique.fetchedAt,
                    };
                    section.items.push(newItem);
                }
            }
        });

        return menu;
    }, [dynamicTechniques]);

    // Calculate recommendations - top 3 items across all categories
    const recommendations = useMemo(() => {
        const allItems: { section: RegulationSection; item: RegulationItem; score: number }[] = [];
        
        enhancedMenu.forEach(section => {
            section.items.forEach(item => {
                const score = scoreItem(item.name, section.id as CategoryId);
                // Boost new web-sourced techniques slightly
                const webBoost = item.source === "web" ? 5 : 0;
                allItems.push({ section, item, score: score + webBoost });
            });
        });

        // Sort by score descending and take top 3
        return allItems
            .sort((a, b) => b.score - a.score)
            .slice(0, 3);
    }, [scoreItem, recentlyUsed, timeOfDay, enhancedMenu]); // eslint-disable-line react-hooks/exhaustive-deps

    // Sort items within each section by score
    const sortedMenu = useMemo(() => {
        return enhancedMenu.map(section => ({
            ...section,
            items: [...section.items].sort((a, b) => {
                const scoreA = scoreItem(a.name, section.id as CategoryId);
                const scoreB = scoreItem(b.name, section.id as CategoryId);
                return scoreB - scoreA;
            })
        }));
    }, [scoreItem, recentlyUsed, enhancedMenu]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleItemClick = (section: RegulationSection, item: RegulationItem) => {
        trackItemUsed(item.name);
        setSelectedItem({ section, item });
    };

    return (
        <section className="stack-sm">
            <div className="flex items-center justify-between">
                <h2 className="section-title">
                    <Sparkles size={18} className="text-primary" />
                    Regulation Menu
                </h2>
                <button
                    onClick={() => fetchDynamicContent(true)}
                    disabled={isRefreshing}
                    className="btn btn-ghost btn-icon text-muted hover:text-primary focus-ring"
                    title={lastRefresh ? `Last updated: ${new Date(lastRefresh).toLocaleDateString()}` : "Refresh techniques"}
                    aria-label={isRefreshing ? "Refreshing techniques..." : "Refresh regulation techniques"}
                >
                    <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} aria-hidden="true" />
                </button>
            </div>

            {/* Context-aware greeting and recommendations */}
            <div className="card mb-4" style={{ 
                background: 'linear-gradient(135deg, rgba(var(--primary-rgb), 0.1), rgba(var(--accent-rgb), 0.1))',
                border: '1px solid rgba(var(--primary-rgb), 0.2)'
            }}>
                <div className="flex items-center gap-2 mb-3">
                    <div className="icon-box icon-box-sm" style={{ 
                        background: 'rgba(var(--primary-rgb), 0.2)',
                        color: 'var(--primary)'
                    }}>
                        {TIME_ICONS[timeOfDay]}
                    </div>
                    <div>
                        <span className="text-sm font-medium">{getGreeting()}</span>
                        {sessionDuration >= 60 && (
                            <span className="text-xs text-muted ml-2">
                                ({Math.floor(sessionDuration / 60)}h active)
                            </span>
                        )}
                    </div>
                </div>

                <p className="text-xs text-muted mb-3">
                    <Zap size={12} className="inline mr-1" />
                    Recommended for you right now:
                </p>

                <div className="flex flex-col gap-2">
                        {recommendations.map(({ section, item }, index) => (
                            <button
                                key={item.name}
                                onClick={() => handleItemClick(section, item)}
                                className="flex items-center gap-3 p-3 rounded-lg transition hover-bg text-left focus-ring"
                                style={{
                                    background: index === 0 
                                        ? `rgba(${section.colorRgb}, 0.15)` 
                                        : 'rgba(var(--elevated-rgb, 37, 36, 32), 0.5)',
                                }}
                                aria-label={`${item.name}, ${item.duration}, ${section.category}`}
                            >
                            <div 
                                className="icon-box icon-box-sm"
                                style={{ 
                                    background: `rgba(${section.colorRgb}, 0.2)`,
                                    color: section.color,
                                }}
                            >
                                {section.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                                <span className="text-sm font-medium block">{item.name}</span>
                                <span className="text-xs text-muted">{item.duration} • {section.category}</span>
                            </div>
                            <ChevronRight size={14} className="text-muted flex-shrink-0" />
                        </button>
                    ))}
                </div>
            </div>

            <div className="dopamine-grid">
                {sortedMenu.map((section) => (
                    <div key={section.id} className="card" style={{ minWidth: 0 }}>
                        <div className="flex items-center gap-2 mb-1">
                            <div 
                                className="icon-box icon-box-sm flex-shrink-0"
                                style={{ 
                                    background: `rgba(${section.colorRgb}, 0.15)`,
                                    color: section.color,
                                }}
                            >
                                {section.icon}
                            </div>
                            <span className="text-xs font-semibold truncate">
                                {section.category}
                            </span>
                        </div>
                        <p className="text-xs text-muted mb-3 line-clamp-2">{section.description}</p>

                        <ul className="step-list">
                            {section.items.map((item) => (
                                <li 
                                    key={item.name}
                                    onClick={() => handleItemClick(section, item)}
                                    className="text-sm hover-bg transition p-2 cursor-pointer flex items-center justify-between rounded-lg -mx-2"
                                >
                                    <span className="flex items-center gap-2">
                                        <span 
                                            className="w-1.5 h-1.5 rounded-full opacity-60"
                                            style={{ 
                                                background: section.color,
                                            }} 
                                        />
                                        {item.name}
                                        {item.source === "web" && (
                                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/20 text-accent flex items-center gap-1">
                                                <Globe size={8} />
                                                New
                                            </span>
                                        )}
                                    </span>
                                    <ChevronRight size={14} className="text-muted" />
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>

            {/* Instruction Modal */}
            {selectedItem && (
                <div 
                    className="modal-overlay animate-fadeIn"
                    onClick={() => setSelectedItem(null)}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="modal-title"
                >
                    <div 
                        className="card modal-content animate-slideIn p-6"
                        onClick={(e) => e.stopPropagation()}
                        role="document"
                    >
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div 
                                    className="icon-box icon-box-lg"
                                    style={{ 
                                        background: `rgba(${selectedItem.section.colorRgb}, 0.15)`,
                                        color: selectedItem.section.color,
                                    }}
                                >
                                    {selectedItem.section.icon}
                                </div>
                                <div>
                                    <h3 id="modal-title" className="font-semibold text-sm">
                                        {selectedItem.item.name}
                                    </h3>
                                    <div className="flex items-center gap-2 text-xs text-muted">
                                        <Clock size={12} aria-hidden="true" />
                                        <span>{selectedItem.item.duration}</span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedItem(null)}
                                className="btn btn-ghost btn-icon focus-ring"
                                aria-label="Close instructions"
                            >
                                <X size={18} aria-hidden="true" />
                            </button>
                        </div>

                        {/* Instructions */}
                        <div className="mb-4">
                            <p className="label mb-2">How to do it</p>
                            <ol className="step-list">
                                {selectedItem.item.instructions.map((instruction, i) => (
                                    <li 
                                        key={i}
                                        className="step-item"
                                    >
                                        <span 
                                            className="step-number"
                                            style={{ 
                                                background: `rgba(${selectedItem.section.colorRgb}, 0.15)`,
                                                color: selectedItem.section.color,
                                            }}
                                        >
                                            {i + 1}
                                        </span>
                                        <span className="text-sm pt-1">
                                            {instruction}
                                        </span>
                                    </li>
                                ))}
                            </ol>
                        </div>

                        {/* Tip */}
                        {selectedItem.item.tip && (
                            <div 
                                className="tip-box"
                                style={{ borderLeftColor: selectedItem.section.color }}
                            >
                                <p className="text-xs text-muted mb-1">Pro tip</p>
                                <p className="text-sm">{selectedItem.item.tip}</p>
                            </div>
                        )}

                        {/* Web source indicator */}
                        {selectedItem.item.source === "web" && (
                            <div className="flex items-center gap-2 mt-3 text-xs text-muted">
                                <Globe size={12} />
                                <span>Auto-discovered technique • {selectedItem.item.fetchedAt ? new Date(selectedItem.item.fetchedAt).toLocaleDateString() : "Recently added"}</span>
                            </div>
                        )}

                        {/* Start Button */}
                        <button
                            onClick={() => setSelectedItem(null)}
                            className="btn btn-primary w-full mt-5 p-3"
                        >
                            Got it
                        </button>
                    </div>
                </div>
            )}
        </section>
    );
}
