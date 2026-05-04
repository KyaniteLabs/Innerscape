"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Calendar as CalendarIcon, Clock, Target, User, Lightbulb, Inbox, Plus, ChevronRight, ChevronLeft, LayoutGrid, Columns, CalendarDays, X, Send, Loader2 } from "lucide-react";
import { useUnifiedStream, UnifiedItem } from "@/lib/hooks/useData";
import { Calendar } from "@/components/Calendar";
import { WeeklyCalendar } from "@/components/WeeklyCalendar";
import { format, isSameDay, parseISO, isValid, addDays, subDays } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/lib/hooks/useToast";

type ViewMode = 'month' | 'week' | 'day';

// Quick Capture Modal Component
function QuickCaptureModal({ 
    isOpen, 
    onClose, 
    onSuccess,
    selectedDate 
}: { 
    isOpen: boolean; 
    onClose: () => void;
    onSuccess: () => void;
    selectedDate: Date | null;
}) {
    const [text, setText] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { success, error } = useToast();

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (!text.trim()) return;
        
        setIsSubmitting(true);
        try {
            // Add date context if a specific date is selected
            let captureText = text;
            if (selectedDate && !isSameDay(selectedDate, new Date())) {
                captureText = `[Due: ${format(selectedDate, "MMM d, yyyy")}] ${text}`;
            }

            const res = await fetch("/api/capture", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: captureText, source: "calendar" }),
            });

            const data = await res.json();
            if (data.success) {
                success("Captured!");
                setText("");
                onSuccess();
                onClose();
            } else {
                throw new Error(data.error || "Failed to capture");
            }
        } catch (e) {
            error(e instanceof Error ? e.message : "Capture failed");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="card p-6 w-full max-w-md"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg">Quick Capture</h3>
                    <button onClick={onClose} className="btn btn-ghost btn-icon">
                        <X size={18} />
                    </button>
                </div>

                {selectedDate && !isSameDay(selectedDate, new Date()) && (
                    <p className="text-sm text-muted mb-3">
                        Adding to: <span className="text-primary font-medium">{format(selectedDate, "EEEE, MMM d")}</span>
                    </p>
                )}

                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="What's on your mind?"
                    className="input min-h-[120px] mb-4"
                    autoFocus
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                            e.preventDefault();
                            handleSubmit();
                        }
                    }}
                />

                <div className="flex items-center justify-between">
                    <span className="text-xs text-muted">⌘+Enter to save</span>
                    <button 
                        onClick={handleSubmit}
                        disabled={!text.trim() || isSubmitting}
                        className="btn btn-primary"
                    >
                        {isSubmitting ? (
                            <Loader2 size={18} className="animate-spin" />
                        ) : (
                            <Send size={18} />
                        )}
                        <span className="ml-2">Capture</span>
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

// Type config for item styling
interface TypeConfigItem {
    icon: typeof Target;
    color: string;
    label: string;
}

// Day Sidebar Component (used in month view)
function DaySidebar({ 
    selectedDate, 
    items, 
    typeConfig,
    itemsWithDueDate 
}: { 
    selectedDate: Date | null;
    items: UnifiedItem[];
    typeConfig: Record<string, TypeConfigItem>;
    itemsWithDueDate: UnifiedItem[];
}) {
    return (
        <div className="space-y-6">
            <div className="card p-6 h-full shadow-glow">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold">
                        {selectedDate ? format(selectedDate, "EEE, MMM d") : "Select a day"}
                    </h3>
                    <div className="text-xs font-bold px-2 py-1 rounded bg-bg text-muted">
                        {items.length} {items.length === 1 ? 'item' : 'items'}
                    </div>
                </div>

                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                    <AnimatePresence mode="popLayout">
                        {items.length === 0 ? (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-center py-12"
                            >
                                <div className="w-16 h-16 bg-elevated rounded-full flex items-center justify-center mx-auto mb-4 text-muted/30">
                                    <Inbox size={32} />
                                </div>
                                <p className="text-muted text-sm italic">Nothing scheduled for this day</p>
                                <button className="btn btn-ghost text-primary text-xs mt-4 group">
                                    <Plus size={14} className="mr-1 group-hover:rotate-90 transition-transform" />
                                    Quick Capture
                                </button>
                            </motion.div>
                        ) : (
                            items.map((item, index) => {
                                const config = typeConfig[item.type];
                                const Icon = config.icon;
                                return (
                                    <motion.div
                                        key={item.id}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="card card-interactive p-4 border-l-4"
                                        style={{ borderLeftColor: config.color }}
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-[10px] uppercase font-bold tracking-widest" style={{ color: config.color }}>
                                                {config.label}
                                            </span>
                                            <span className="text-xs text-muted ml-auto flex items-center gap-1">
                                                <Clock size={12} />
                                                {item.temporal.dueDate ? format(parseISO(item.temporal.dueDate), "h:mm a") : "All day"}
                                            </span>
                                        </div>
                                        <h4 className="font-medium text-sm mb-1">{item.name}</h4>
                                        {item.content && (
                                            <p className="text-xs text-muted line-clamp-2">{item.content}</p>
                                        )}
                                        <div className="flex items-center justify-between mt-3">
                                            <div className="flex gap-1">
                                                {item.tags.slice(0, 2).map(tag => (
                                                    <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded-full bg-elevated text-muted">
                                                        #{tag}
                                                    </span>
                                                ))}
                                            </div>
                                            <Link href={`/inbox?id=${item.id}`} className="text-xs text-primary hover:underline flex items-center gap-1">
                                                View <ChevronRight size={12} />
                                            </Link>
                                        </div>
                                    </motion.div>
                                );
                            })
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Summary Widget */}
            <div className="card p-6 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20 shadow-glow">
                <h4 className="font-bold text-sm mb-4">Timeline Summary</h4>
                <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-muted flex items-center gap-2">
                            <Clock size={14} className="text-primary" />
                            Pending Tasks
                        </span>
                        <span className="font-bold">{itemsWithDueDate.filter(i => i.type === 'admin').length}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-muted flex items-center gap-2">
                            <Target size={14} className="text-accent" />
                            Active Projects
                        </span>
                        <span className="font-bold">{itemsWithDueDate.filter(i => i.type === 'projects').length}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Full Day Detail View Component
function DayDetailView({ 
    selectedDate, 
    setSelectedDate,
    items, 
    typeConfig,
    onOpenCapture
}: { 
    selectedDate: Date | null;
    setSelectedDate: (date: Date) => void;
    items: UnifiedItem[];
    typeConfig: Record<string, TypeConfigItem>;
    onOpenCapture: () => void;
}) {
    const goToPrevDay = () => selectedDate && setSelectedDate(subDays(selectedDate, 1));
    const goToNextDay = () => selectedDate && setSelectedDate(addDays(selectedDate, 1));
    const goToToday = () => setSelectedDate(new Date());

    return (
        <div className="card p-8 shadow-glow">
            {/* Day Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button onClick={goToPrevDay} className="btn btn-ghost btn-icon">
                        <ChevronLeft size={20} />
                    </button>
                    <div className="text-center">
                        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                            {selectedDate ? format(selectedDate, "EEEE") : "Select a day"}
                        </h2>
                        <p className="text-muted">
                            {selectedDate ? format(selectedDate, "MMMM d, yyyy") : ""}
                        </p>
                    </div>
                    <button onClick={goToNextDay} className="btn btn-ghost btn-icon">
                        <ChevronRight size={20} />
                    </button>
                </div>
                <button onClick={goToToday} className="btn btn-secondary text-sm">
                    Today
                </button>
            </div>

            {/* Items Grid */}
            {items.length === 0 ? (
                <div className="text-center py-16">
                    <div className="w-20 h-20 bg-elevated rounded-full flex items-center justify-center mx-auto mb-6 text-muted/30">
                        <Inbox size={40} />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No items scheduled</h3>
                    <p className="text-muted text-sm mb-6">This day is clear. Time to capture something new!</p>
                    <button onClick={onOpenCapture} className="btn btn-primary group">
                        <Plus size={18} className="mr-2 group-hover:rotate-90 transition-transform" />
                        Quick Capture
                    </button>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <AnimatePresence mode="popLayout">
                        {items.map((item, index) => {
                            const config = typeConfig[item.type];
                            const Icon = config.icon;
                            return (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="card p-5 border-l-4 hover:shadow-lg transition-shadow"
                                    style={{ borderLeftColor: config.color }}
                                >
                                    <div className="flex items-center gap-2 mb-3">
                                        <div 
                                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                                            style={{ background: `${config.color}20` }}
                                        >
                                            <Icon size={16} style={{ color: config.color }} />
                                        </div>
                                        <span className="text-xs uppercase font-bold tracking-widest" style={{ color: config.color }}>
                                            {config.label}
                                        </span>
                                        <span className="text-xs text-muted ml-auto">
                                            {item.temporal.dueDate ? format(parseISO(item.temporal.dueDate), "h:mm a") : "All day"}
                                        </span>
                                    </div>
                                    
                                    <h4 className="font-semibold mb-2">{item.name}</h4>
                                    
                                    {item.content && (
                                        <p className="text-sm text-muted line-clamp-3 mb-3">{item.content}</p>
                                    )}
                                    
                                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-border">
                                        <div className="flex gap-1">
                                            {item.tags.slice(0, 2).map(tag => (
                                                <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-elevated text-muted">
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>
                                        <Link 
                                            href={`/inbox?id=${item.id}`} 
                                            className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
                                        >
                                            Open <ChevronRight size={12} />
                                        </Link>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}

export default function CalendarPage() {
    const { items, isLoading, error, refetch } = useUnifiedStream({ limit: 1000 }); // Get more items for calendar
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
    const [viewMode, setViewMode] = useState<ViewMode>('month');
    const [showCaptureModal, setShowCaptureModal] = useState(false);

    // Filter items that have a due date
    const itemsWithDueDate = useMemo(() => {
        return items.filter(item => item.temporal.dueDate !== null);
    }, [items]);

    // Compute selected day items reactively (no setState in useMemo!)
    const computedDayItems = useMemo(() => {
        if (!selectedDate || itemsWithDueDate.length === 0) return [];
        return itemsWithDueDate.filter(item => {
            const date = parseISO(item.temporal.dueDate!);
            return isValid(date) && isSameDay(date, selectedDate);
        });
    }, [itemsWithDueDate, selectedDate]);

    const handleDayClick = (date: Date, _dayItems?: UnifiedItem[]) => {
        setSelectedDate(date);
        // If clicking a day in month/week view, switch to day view for detail
        if (viewMode !== 'day') {
            setViewMode('day');
        }
    };

    const handleWeekDayClick = (date: Date) => {
        setSelectedDate(date);
        setViewMode('day');
    };

    const typeConfig = {
        projects: { icon: Target, color: 'var(--color-projects)', label: 'Project' },
        people: { icon: User, color: 'var(--color-people)', label: 'Person' },
        ideas: { icon: Lightbulb, color: 'var(--color-ideas)', label: 'Idea' },
        admin: { icon: Clock, color: 'var(--color-admin)', label: 'Task' },
    };

    return (
        <main className="min-h-screen bg-bg">
            {/* Quick Capture Modal */}
            <QuickCaptureModal 
                isOpen={showCaptureModal}
                onClose={() => setShowCaptureModal(false)}
                onSuccess={() => refetch?.()}
                selectedDate={selectedDate}
            />

            <div className="layout-container py-8">
                {/* Header */}
                <header className="header mb-8">
                    <div className="header-brand">
                        <Link href="/" className="btn btn-secondary flex items-center gap-2 px-3 h-10 mr-2">
                            <ArrowLeft size={20} />
                            <span className="hidden sm:inline">Back</span>
                        </Link>
                        <div className="header-icon bg-gradient-primary text-white shadow-glow">
                            <CalendarIcon size={20} />
                        </div>
                        <div>
                            <h1 className="title">Calendar</h1>
                            <p className="subtitle">Visualize your upcoming nodes</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                        {/* Quick Capture Button */}
                        <button
                            onClick={() => setShowCaptureModal(true)}
                            className="btn btn-primary btn-icon sm:px-4 sm:w-auto"
                            title="Quick Capture"
                        >
                            <Plus size={18} />
                            <span className="hidden sm:inline ml-2">Capture</span>
                        </button>

                        {/* View Mode Toggle */}
                        <div className="flex items-center gap-0.5 sm:gap-1 bg-elevated rounded-lg p-0.5 sm:p-1 border border-border">
                        <button
                            onClick={() => setViewMode('month')}
                            className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-all ${
                                viewMode === 'month' 
                                    ? 'bg-primary text-white shadow-sm' 
                                    : 'text-muted hover:text-text hover:bg-hover'
                            }`}
                        >
                            <LayoutGrid size={14} className="sm:w-4 sm:h-4" />
                            <span className="hidden sm:inline">Month</span>
                        </button>
                        <button
                            onClick={() => setViewMode('week')}
                            className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-all ${
                                viewMode === 'week' 
                                    ? 'bg-primary text-white shadow-sm' 
                                    : 'text-muted hover:text-text hover:bg-hover'
                            }`}
                        >
                            <Columns size={14} className="sm:w-4 sm:h-4" />
                            <span className="hidden sm:inline">Week</span>
                        </button>
                        <button
                            onClick={() => setViewMode('day')}
                            className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-all ${
                                viewMode === 'day' 
                                    ? 'bg-primary text-white shadow-sm' 
                                    : 'text-muted hover:text-text hover:bg-hover'
                            }`}
                        >
                            <CalendarDays size={14} className="sm:w-4 sm:h-4" />
                            <span className="hidden sm:inline">Day</span>
                        </button>
                        </div>
                    </div>
                </header>

                {/* Loading State */}
                {isLoading ? (
                    <div className="card p-6">
                        <div className="flex flex-col items-center justify-center py-20 text-muted">
                            <div className="spinner-gradient w-10 h-10 mb-4" />
                            <p>Gathering your timeline...</p>
                        </div>
                    </div>
                ) : error ? (
                    <div className="card p-8 text-center text-destructive">
                        <p>Failed to load items: {error}</p>
                    </div>
                ) : (
                    <AnimatePresence mode="wait">
                        {/* Month View - Full Width Calendar */}
                        {viewMode === 'month' && (
                            <motion.div
                                key="month"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                            >
                                <div className="card p-4 min-h-[700px]">
                                    <Calendar 
                                        items={itemsWithDueDate} 
                                        onDayClick={handleDayClick}
                                        selectedDate={selectedDate}
                                    />
                                </div>
                            </motion.div>
                        )}

                        {/* Week View - Full Width */}
                        {viewMode === 'week' && (
                            <motion.div
                                key="week"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                            >
                                <div className="card p-4 min-h-[600px]">
                                    <WeeklyCalendar 
                                        items={itemsWithDueDate} 
                                        onDayClick={handleWeekDayClick}
                                        selectedDate={selectedDate}
                                    />
                                </div>
                            </motion.div>
                        )}

                        {/* Day View */}
                        {viewMode === 'day' && (
                            <motion.div
                                key="day"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                            >
                                <DayDetailView 
                                    selectedDate={selectedDate}
                                    setSelectedDate={setSelectedDate}
                                    items={computedDayItems}
                                    typeConfig={typeConfig}
                                    onOpenCapture={() => setShowCaptureModal(true)}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                )}
            </div>
        </main>
    );
}
