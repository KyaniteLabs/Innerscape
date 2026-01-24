"use client";

import { QuickCapture } from "@/components/QuickCapture";
import { DopamineMenu } from "@/components/DopamineMenu";
import { ShutdownRitual } from "@/components/ShutdownRitual";
import { ThemeToggle } from "@/components/ThemeToggle";
import { StreakCounter, useCelebration } from "@/components/Celebrations";
import { CompactStats, ActivityIndicator } from "@/components/Progress";
import { useProjects, useStats, useInbox, useUnifiedStream, UnifiedItem } from "@/lib/hooks/useData";
import { useEffect, useState, Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Calendar, Target, Inbox, AlertCircle, Loader2, CheckCircle, Trash2, Clock, Sunrise, Sun, Sunset, Moon, BarChart3, Flame, Zap, TrendingUp, User, Lightbulb, Archive, MoreHorizontal, History, Pencil, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useTimeContext } from "@/lib/hooks/useAppContext";
import { EditItemModal } from "@/components/EditItemModal";

export const dynamic = 'force-dynamic';

// Time-aware greetings
const TIME_GREETINGS = {
    morning: { text: "Good morning!", sub: "Here's your focus for today" },
    afternoon: { text: "Good afternoon!", sub: "Afternoon check-in" },
    evening: { text: "Good evening!", sub: "Time to wind down" },
    night: { text: "It's late!", sub: "Don't forget to rest" },
};

const TIME_ICONS = {
    morning: Sunrise,
    afternoon: Sun,
    evening: Sunset,
    night: Moon,
};

// Wrapper component that uses search params (needs Suspense boundary)
function QuickCaptureWithVoice({ onCaptureSuccess }: { onCaptureSuccess?: () => void }) {
    const searchParams = useSearchParams();
    const autoStartVoice = searchParams.get("voice") === "true";
    return <QuickCapture autoStartVoice={autoStartVoice} onCaptureSuccess={onCaptureSuccess} />;
}

export default function Home() {
    const [isMounted, setIsMounted] = useState(false);
    const { stats, isLoading: statsLoading, refetch: refetchStats } = useStats();
    const { items: stream, isLoading: streamLoading, refetch: refetchStream } = useUnifiedStream();
    const { items: needsReview, refetch: refetchInbox } = useInbox("needs_review");
    const [streak, setStreak] = useState({ current: 0, longest: 0, todayComplete: false });
    const { timeOfDay, isEvening, isLateNight } = useTimeContext();
    const { celebrate, CelebrationElements } = useCelebration();

    // Edit modal state
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<UnifiedItem | null>(null);
    
    // Classification state
    const [classifyingId, setClassifyingId] = useState<string | null>(null);

    // Handle manual classification of inbox items
    const handleClassify = async (inboxId: string, destination: "projects" | "people" | "ideas" | "admin") => {
        setClassifyingId(inboxId);
        try {
            const res = await fetch("/api/inbox/classify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ inboxId, destination }),
            });
            const data = await res.json();
            if (data.success) {
                // Refresh all data
                await Promise.all([refetchInbox(), refetchStream(), refetchStats()]);
            } else {
                console.error("[APEX] Classification failed:", data.error);
                alert(data.error || "Failed to classify item");
            }
        } catch (err) {
            console.error("[APEX] Classification error:", err);
            alert("Failed to classify item");
        } finally {
            setClassifyingId(null);
        }
    };

    const handleEditItem = (item: UnifiedItem) => {
        setSelectedItem(item);
        setIsEditModalOpen(true);
    };

    const handleEditSuccess = () => {
        refetchStats?.();
        refetchStream?.();
        refetchInbox?.();
        
        // Celebrate successful edit
        celebrate({
            toast: { message: "Saved! ✨", type: "success" }
        });
    };

    // Get time-aware greeting
    const greeting = useMemo(() => TIME_GREETINGS[timeOfDay], [timeOfDay]);
    const TimeIcon = TIME_ICONS[timeOfDay];

    // Fetch streak data
    const fetchStreak = async () => {
        try {
            const res = await fetch("/api/analytics/captures");
            if (res.ok) {
                const data = await res.json();
                if (data.success && data.analytics?.streak) {
                    setStreak({
                        current: data.analytics.streak.current || 0,
                        longest: data.analytics.streak.longest || 0,
                        todayComplete: data.analytics.streak.todayComplete || false,
                    });
                }
            }
        } catch (err) {
            console.error("[APEX] Failed to fetch streak:", err);
        }
    };

    // Refresh all data after capture
    const handleCaptureSuccess = () => {
        refetchStats?.();
        refetchStream?.();
        refetchInbox?.();
        fetchStreak();
        
        // Trigger celebration for captures - with confetti!
        celebrate({
            confetti: true,
            toast: { message: "Captured! 🎉", type: "success" }
        });
    };

    useEffect(() => {
        setIsMounted(true);
        fetchStreak();
    }, []);

    if (!isMounted) return null;

    // Get status label based on inbox
    const getStatusLabel = () => {
        if (statsLoading) return "Loading...";
        if (!stats) return "Active";
        if (stats.inbox.needsReview > 0) return `${stats.inbox.needsReview} to review`;
        if (stats.inbox.pending > 0) return "Processing...";
        return "All clear";
    };

    return (
        <main>
            {/* Celebration elements (confetti, toasts) */}
            <CelebrationElements />

            {/* Edit Modal */}
            {selectedItem && (
                <EditItemModal 
                    item={selectedItem}
                    isOpen={isEditModalOpen}
                    onClose={() => {
                        setIsEditModalOpen(false);
                        setSelectedItem(null);
                    }}
                    onSuccess={handleEditSuccess}
                />
            )}

            <div className="layout-container">
                {/* Header */}
                <header className="header">
                    <div className="header-brand">
                        <div 
                            className="header-icon"
                            style={{
                                background: isLateNight 
                                    ? 'rgba(var(--warning-rgb), 0.2)' 
                                    : 'var(--gradient-primary-subtle)',
                                color: isLateNight ? 'var(--warning)' : undefined,
                            }}
                        >
                            <TimeIcon size={20} />
                        </div>
                        <div>
                            <h1 className="title text-gradient-vibrant">{greeting.text}</h1>
                            <p className="subtitle">{greeting.sub}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                        {/* Streak Badge - hide on very small screens */}
                        {streak.current > 0 && (
                            <span className="hidden sm:inline-flex">
                                <StreakCounter 
                                    count={streak.current} 
                                    size="sm"
                                />
                            </span>
                        )}
                        
                        <Link 
                            href="/calendar" 
                            className="btn btn-secondary btn-icon sm:px-4 sm:w-auto h-10 shadow-sm hover:border-primary transition-all group"
                            title="View Calendar"
                        >
                            <Calendar size={18} className="text-primary group-hover:scale-110 transition-transform" />
                            <span className="hidden md:inline font-medium ml-2">Calendar</span>
                        </Link>
                        
                        <Link 
                            href="/analytics" 
                            className="btn btn-secondary btn-icon sm:px-4 sm:w-auto h-10 shadow-sm hover:border-accent transition-all group"
                            title="View Analytics"
                        >
                            <BarChart3 size={18} className="text-accent group-hover:scale-110 transition-transform" />
                            <span className="hidden md:inline font-medium ml-2">Analytics</span>
                        </Link>
                        
                        <div className="text-right hidden md:block">
                            <div className="flex items-center gap-1 justify-end">
                                <ActivityIndicator isActive={(stats?.inbox?.pending ?? 0) > 0} size="sm" />
                                <p className="text-xs text-muted uppercase tracking-wider">Status</p>
                            </div>
                            <p className="text-sm">{getStatusLabel()}</p>
                        </div>
                        
                        <ThemeToggle />
                    </div>
                </header>

                {/* Stats Bar */}
                {stats && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-6">
                        <Link href="/inbox" className="card card-interactive card-shine stat-vibrant flex items-center gap-2 sm:gap-3 p-2 sm:p-3 no-underline" style={{ borderLeftColor: 'var(--color-inbox)', borderLeftWidth: '3px' }}>
                            <div className="icon-box-sm flex-shrink-0" style={{ background: 'rgba(var(--color-inbox-rgb), 0.15)', color: 'var(--color-inbox)' }}>
                                <Inbox size={16} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs text-muted truncate">Captured</p>
                                <p className="font-semibold text-base sm:text-lg">{stats.inbox.totalCaptured}</p>
                            </div>
                        </Link>
                        <Link href="/projects" className="card card-interactive card-shine stat-vibrant flex items-center gap-2 sm:gap-3 p-2 sm:p-3 no-underline" style={{ borderLeftColor: 'var(--color-projects)', borderLeftWidth: '3px' }}>
                            <div className="icon-box-sm flex-shrink-0" style={{ background: 'rgba(var(--color-projects-rgb), 0.15)', color: 'var(--color-projects)' }}>
                                <Target size={16} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs text-muted truncate">Active</p>
                                <p className="font-semibold text-lg">{stream.filter(i => i.type === 'projects').length}</p>
                            </div>
                        </Link>
                        {stats.inbox.needsReview > 0 && (
                            <Link 
                                href="/inbox?status=needs_review" 
                                className="card card-interactive flex items-center gap-2 sm:gap-3 p-2 sm:p-3 no-underline animate-pulse col-span-2 sm:col-span-1"
                                style={{ borderColor: 'var(--warning)' }}
                            >
                                <div className="icon-box-sm flex-shrink-0" style={{ background: 'rgba(var(--warning-rgb), 0.15)', color: 'var(--warning)' }}>
                                    <AlertCircle size={16} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs text-muted truncate">Review</p>
                                    <p className="font-semibold text-base sm:text-lg">{stats.inbox.needsReview}</p>
                                </div>
                            </Link>
                        )}
                    </div>
                )}

                {/* Main Grid */}
                <div className="main-grid">
                    {/* Primary Column */}
                    <div className="stack">
                        {/* Quick Capture */}
                        <Suspense fallback={<QuickCapture />}>
                            <QuickCaptureWithVoice onCaptureSuccess={handleCaptureSuccess} />
                        </Suspense>

                        {/* Unified Knowledge Stream */}
                        <section className="stack-sm">
                            <div className="flex items-center justify-between">
                                <h2 className="section-title">
                                    <History size={18} className="text-primary" />
                                    Knowledge Stream
                                </h2>
                                <div className="flex gap-2">
                                    {/* Type filters could go here */}
                                </div>
                            </div>

                            {streamLoading ? (
                                <div className="flex items-center justify-center p-12 text-muted">
                                    <div className="spinner-gradient" />
                                </div>
                            ) : stream.length === 0 ? (
                                <div className="card text-center p-12">
                                    <Inbox size={48} className="text-muted m-auto mb-4 opacity-30" />
                                    <p className="text-muted text-lg">Your stream is empty</p>
                                    <p className="text-sm text-muted mt-2">
                                        Capture your first thought above to start building your brain.
                                    </p>
                                </div>
                            ) : (
                                <div className="stack-sm">
                                    {stream.map((item) => (
                                        <StreamItem 
                                            key={item.id} 
                                            item={item} 
                                            onEdit={() => handleEditItem(item)}
                                        />
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* Dopamine Menu */}
                        <DopamineMenu />
                    </div>

                    {/* Sidebar */}
                    <aside className="stack">
                        {/* New: Quick Calendar Access */}
                        <div className="card p-5 gradient-animated border-primary/20 shadow-glow group">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <div className="icon-box-primary icon-box-sm">
                                        <Calendar size={18} />
                                    </div>
                                    <h3 className="font-bold text-sm">Timeline</h3>
                                </div>
                                <Link 
                                    href="/calendar" 
                                    className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
                                >
                                    Full View <ChevronRight size={14} />
                                </Link>
                            </div>
                            
                            <div className="stack-xs">
                                {stream.filter(i => i.temporal.dueDate).slice(0, 3).map(item => (
                                    <div 
                                        key={item.id} 
                                        className="flex items-center gap-3 p-2 rounded-lg bg-surface/50 border border-border/50 hover:bg-hover hover:border-primary/30 transition-all cursor-pointer group/item"
                                        onClick={() => handleEditItem(item)}
                                    >
                                        <div className="w-1.5 h-8 rounded-full flex-shrink-0" style={{ background: `var(--color-${item.type})` }} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium truncate group-hover/item:text-primary transition-colors">{item.name}</p>
                                            <p className="text-[10px] text-muted">
                                                {new Date(item.temporal.dueDate!).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            </p>
                                        </div>
                                        <div className="opacity-0 group-hover/item:opacity-100 transition-opacity">
                                            <Pencil size={12} className="text-muted" />
                                        </div>
                                    </div>
                                ))}
                                {stream.filter(i => i.temporal.dueDate).length === 0 && (
                                    <p className="text-xs text-muted italic text-center py-2">No upcoming dates</p>
                                )}
                            </div>

                            <Link 
                                href="/calendar"
                                className="btn btn-primary w-full mt-4 text-xs py-2 shadow-sm group-hover:shadow-glow transition-all"
                            >
                                Open Calendar View
                            </Link>
                        </div>

                        <ShutdownRitual />

                        {/* Needs Review */}
                        {needsReview.length > 0 && (
                            <div className="card" style={{ borderColor: 'var(--warning)' }}>
                                <div className="flex items-center gap-2 mb-4">
                                    <AlertCircle size={18} className="text-warning" />
                                    <h3 className="font-semibold text-sm">Needs Review</h3>
                                    <span className="text-xs text-muted ml-auto">{needsReview.length}</span>
                                </div>
                                <div className="stack-sm">
                                    {needsReview.slice(0, 5).map((item) => (
                                        <div key={item.id} className="p-3 bg-elevated rounded-lg border border-border/50">
                                            <p className="text-sm text-text mb-3 line-clamp-2">
                                                {item.originalText}
                                            </p>
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <span className="text-[10px] text-muted mr-1">Classify as:</span>
                                                <button
                                                    onClick={() => handleClassify(item.id, "admin")}
                                                    disabled={classifyingId === item.id}
                                                    className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded bg-surface border border-border hover:border-primary/50 hover:bg-primary/10 transition-colors disabled:opacity-50"
                                                    title="Create as Task"
                                                >
                                                    <Clock size={10} />
                                                    Task
                                                </button>
                                                <button
                                                    onClick={() => handleClassify(item.id, "projects")}
                                                    disabled={classifyingId === item.id}
                                                    className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded bg-surface border border-border hover:border-primary/50 hover:bg-primary/10 transition-colors disabled:opacity-50"
                                                    title="Create as Project"
                                                >
                                                    <Target size={10} />
                                                    Project
                                                </button>
                                                <button
                                                    onClick={() => handleClassify(item.id, "ideas")}
                                                    disabled={classifyingId === item.id}
                                                    className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded bg-surface border border-border hover:border-primary/50 hover:bg-primary/10 transition-colors disabled:opacity-50"
                                                    title="Create as Idea"
                                                >
                                                    <Lightbulb size={10} />
                                                    Idea
                                                </button>
                                                <button
                                                    onClick={() => handleClassify(item.id, "people")}
                                                    disabled={classifyingId === item.id}
                                                    className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded bg-surface border border-border hover:border-primary/50 hover:bg-primary/10 transition-colors disabled:opacity-50"
                                                    title="Create as Person"
                                                >
                                                    <User size={10} />
                                                    Person
                                                </button>
                                                {classifyingId === item.id && (
                                                    <Loader2 size={12} className="animate-spin text-primary ml-1" />
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {needsReview.length > 5 && (
                                        <Link 
                                            href="/inbox?status=needs_review"
                                            className="text-xs text-accent no-underline text-center block py-2"
                                        >
                                            +{needsReview.length - 5} more items →
                                        </Link>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Quick Stats */}
                        {stats && (
                            <div className="card">
                                <div className="flex items-center gap-2 mb-4">
                                    <Calendar size={18} className="text-accent" />
                                    <h3 className="font-semibold text-sm">Your Brain</h3>
                                </div>
                                <div className="stack-sm">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted">Projects</span>
                                        <span className="text-sm">{stream.filter(i => i.type === 'projects').length} active</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted">People</span>
                                        <span className="text-sm">{stream.filter(i => i.type === 'people').length}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted">Ideas</span>
                                        <span className="text-sm">{stream.filter(i => i.type === 'ideas').length}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted">Tasks</span>
                                        <span className="text-sm">{stream.filter(i => i.type === 'admin').length} pending</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </aside>
                </div>

                {/* Footer */}
                <footer className="footer">
                    <span>NeuroSecond v2.1.0</span>
                    <span>Knowledge Stream Architecture</span>
                </footer>
            </div>
        </main>
    );
}

function StreamItem({ item, onEdit }: { item: UnifiedItem; onEdit?: () => void }) {
    const isStale = useMemo(() => {
        const lastTouch = new Date(item.temporal.lastTouched);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return lastTouch < thirtyDaysAgo;
    }, [item.temporal.lastTouched]);

    const typeConfig = {
        projects: { icon: Target, color: 'var(--color-projects)', label: 'Project' },
        people: { icon: User, color: 'var(--color-people)', label: 'Person' },
        ideas: { icon: Lightbulb, color: 'var(--color-ideas)', label: 'Idea' },
        admin: { icon: Clock, color: 'var(--color-admin)', label: 'Task' },
    };

    const config = typeConfig[item.type];
    const Icon = config.icon;

    return (
        <div className={`card card-interactive relative overflow-hidden group ${isStale ? 'opacity-60' : ''}`}>
            {isStale && (
                <div className="absolute top-0 right-0 p-2" title="Stale item (not touched in 30 days)">
                    <Archive size={12} className="text-muted" />
                </div>
            )}
            
            <div className="flex items-start gap-3">
                <div 
                    className="icon-box-sm flex-shrink-0" 
                    style={{ background: `rgba(var(--${item.type}-rgb, 100, 100, 100), 0.15)`, color: config.color }}
                >
                    <Icon size={16} />
                </div>
                
                <div className="flex-1 min-w-0" onClick={onEdit} style={{ cursor: 'pointer' }}>
                    <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-1">
                        <span className="text-[10px] uppercase tracking-wider font-bold" style={{ color: config.color }}>
                            {config.label}
                        </span>
                        <span className="text-[10px] text-muted">•</span>
                        <span className="text-[10px] text-muted">
                            {new Date(item.temporal.lastTouched).toLocaleDateString()}
                        </span>
                        {item.temporal.dueDate && (
                            <span className={`text-[10px] font-bold ${new Date(item.temporal.dueDate) < new Date() ? 'text-destructive' : 'text-accent'}`}>
                                • Due: {new Date(item.temporal.dueDate).toLocaleDateString()}
                            </span>
                        )}
                    </div>
                    
                    <h3 className="font-medium text-sm mb-1 group-hover:text-primary transition-colors">
                        {item.name}
                    </h3>
                    
                    {item.content && (
                        <p className="text-xs text-muted line-clamp-2">
                            {item.content}
                        </p>
                    )}

                    {item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                            {item.tags.slice(0, 3).map(tag => (
                                <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded-full bg-elevated text-muted">
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <button onClick={(e) => { e.stopPropagation(); onEdit?.(); }} className="btn btn-ghost btn-icon btn-sm" title="Edit item">
                        <Pencil size={14} />
                    </button>
                    <button className="btn btn-ghost btn-icon btn-sm">
                        <MoreHorizontal size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
}
