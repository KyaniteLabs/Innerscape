"use client";

import { useState, useMemo } from "react";
import { 
    format, 
    addWeeks, 
    subWeeks, 
    startOfWeek, 
    endOfWeek, 
    eachDayOfInterval,
    isToday,
    isSameDay,
    parseISO,
    isValid
} from "date-fns";
import { ChevronLeft, ChevronRight, Clock, Target, User, Lightbulb } from "lucide-react";
import { UnifiedItem } from "@/lib/hooks/useData";

interface WeeklyCalendarProps {
    items: UnifiedItem[];
    onDayClick?: (date: Date) => void;
    selectedDate?: Date | null;
}

// Type colors matching the monthly calendar
const TYPE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
    projects: { bg: "bg-purple-500/20", border: "border-l-purple-500", text: "text-purple-400" },
    people: { bg: "bg-pink-500/20", border: "border-l-pink-500", text: "text-pink-400" },
    ideas: { bg: "bg-lime-500/20", border: "border-l-lime-500", text: "text-lime-400" },
    admin: { bg: "bg-rose-500/20", border: "border-l-rose-500", text: "text-rose-400" },
};

const TYPE_ICONS: Record<string, React.ElementType> = {
    projects: Target,
    people: User,
    ideas: Lightbulb,
    admin: Clock,
};

export function WeeklyCalendar({ items, onDayClick, selectedDate }: WeeklyCalendarProps) {
    const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date()));

    const nextWeek = () => setCurrentWeekStart(addWeeks(currentWeekStart, 1));
    const prevWeek = () => setCurrentWeekStart(subWeeks(currentWeekStart, 1));
    const goToToday = () => setCurrentWeekStart(startOfWeek(new Date()));

    const weekEnd = endOfWeek(currentWeekStart);
    
    const days = useMemo(() => {
        return eachDayOfInterval({ start: currentWeekStart, end: weekEnd });
    }, [currentWeekStart, weekEnd]);

    // Group items by date
    const itemsByDate = useMemo(() => {
        const groups: Record<string, UnifiedItem[]> = {};
        items.forEach(item => {
            if (item.temporal.dueDate) {
                const date = parseISO(item.temporal.dueDate);
                if (isValid(date)) {
                    const dateKey = format(date, "yyyy-MM-dd");
                    if (!groups[dateKey]) groups[dateKey] = [];
                    groups[dateKey].push(item);
                }
            }
        });
        return groups;
    }, [items]);

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 px-2">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-bold">
                        {format(currentWeekStart, "MMM d")} – {format(weekEnd, "MMM d, yyyy")}
                    </h2>
                    <button
                        onClick={goToToday}
                        className="px-3 py-1 text-sm font-medium rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                    >
                        Today
                    </button>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={prevWeek}
                        className="p-2 rounded-lg hover:bg-elevated transition-colors"
                        aria-label="Previous week"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <button
                        onClick={nextWeek}
                        className="p-2 rounded-lg hover:bg-elevated transition-colors"
                        aria-label="Next week"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            {/* Week Grid - 7 horizontal columns */}
            <div className="flex-1 grid grid-cols-7 border-l border-t border-border rounded-lg overflow-hidden" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
                {days.map((day) => {
                    const dateKey = format(day, "yyyy-MM-dd");
                    const dayItems = itemsByDate[dateKey] || [];
                    const today = isToday(day);
                    const isSelected = selectedDate && isSameDay(day, selectedDate);

                    return (
                        <div
                            key={day.toString()}
                            onClick={() => onDayClick?.(day)}
                            className={`
                                flex flex-col min-h-[400px] border-r border-b border-border cursor-pointer
                                transition-colors
                                ${today ? "bg-primary/5" : "bg-surface hover:bg-hover/30"}
                                ${isSelected ? "bg-primary/10 ring-2 ring-inset ring-primary" : ""}
                            `}
                        >
                            {/* Day Header */}
                            <div className={`p-3 border-b ${today ? "border-primary/30 bg-primary/10" : "border-border"}`}>
                                <div className="text-xs font-semibold text-muted uppercase tracking-wider text-center">
                                    {format(day, "EEE")}
                                </div>
                                <div className={`text-3xl font-bold text-center ${today ? "text-primary" : ""}`}>
                                    {format(day, "d")}
                                </div>
                            </div>

                            {/* Day Items - Scrollable area */}
                            <div className="flex-1 p-2 space-y-1.5 overflow-y-auto">
                                {dayItems.map((item) => {
                                    const colors = TYPE_COLORS[item.type] || TYPE_COLORS.admin;
                                    const Icon = TYPE_ICONS[item.type] || Clock;
                                    return (
                                        <div
                                            key={item.id}
                                            className={`
                                                flex items-center gap-1.5 px-2 py-1.5 rounded text-xs font-medium
                                                border-l-2 ${colors.bg} ${colors.border}
                                                hover:brightness-110 transition-all
                                            `}
                                            title={item.name}
                                        >
                                            <Icon size={12} className={`${colors.text} flex-shrink-0`} />
                                            <span className="truncate">{item.name}</span>
                                        </div>
                                    );
                                })}
                                {dayItems.length === 0 && (
                                    <div className="h-full flex items-center justify-center text-muted/30 text-xs">
                                        –
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
