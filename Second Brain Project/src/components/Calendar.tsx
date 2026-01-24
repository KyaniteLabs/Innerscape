"use client";

import { useState, useMemo } from "react";
import { 
    format, 
    addMonths, 
    subMonths, 
    startOfMonth, 
    endOfMonth, 
    startOfWeek, 
    endOfWeek, 
    isSameMonth, 
    isSameDay, 
    eachDayOfInterval,
    isToday,
    parseISO,
    isValid
} from "date-fns";
import { ChevronLeft, ChevronRight, Target, User, Lightbulb, Clock } from "lucide-react";
import { UnifiedItem } from "@/lib/hooks/useData";

interface CalendarProps {
    items: UnifiedItem[];
    onDayClick?: (date: Date, dayItems: UnifiedItem[]) => void;
    selectedDate?: Date | null;
}

// Type colors for events
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

export function Calendar({ items, onDayClick, selectedDate }: CalendarProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const goToToday = () => setCurrentMonth(new Date());

    // Get all days for the current month view (including padding days)
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);

    const days = useMemo(() => {
        return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    }, [calendarStart, calendarEnd]);

    // Group items by date for efficient lookup
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

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    return (
        <div className="h-full flex flex-col">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-4 px-2">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-bold">
                        {format(currentMonth, "MMMM yyyy")}
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
                        onClick={prevMonth}
                        className="p-2 rounded-lg hover:bg-elevated transition-colors"
                        aria-label="Previous month"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <button
                        onClick={nextMonth}
                        className="p-2 rounded-lg hover:bg-elevated transition-colors"
                        aria-label="Next month"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            {/* Day Headers - 7 columns */}
            <div 
                className="border-b border-border"
                style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}
            >
                {dayNames.map(day => (
                    <div 
                        key={day} 
                        className="py-3 text-center text-xs font-semibold text-muted uppercase tracking-wider"
                    >
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid - 7 columns x 6 rows */}
            <div 
                className="flex-1 border-l border-border"
                style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}
            >
                {days.map((day) => {
                    const dateKey = format(day, "yyyy-MM-dd");
                    const dayItems = itemsByDate[dateKey] || [];
                    const isCurrentMonth = isSameMonth(day, monthStart);
                    const isSelected = selectedDate && isSameDay(day, selectedDate);
                    const today = isToday(day);

                    return (
                        <div
                            key={day.toString()}
                            onClick={() => onDayClick?.(day, dayItems)}
                            className={`
                                relative min-h-[120px] p-2 border-r border-b border-border cursor-pointer
                                transition-colors group
                                ${!isCurrentMonth ? "bg-bg/50" : "bg-surface hover:bg-hover/50"}
                                ${isSelected ? "bg-primary/5 ring-2 ring-inset ring-primary" : ""}
                            `}
                        >
                            {/* Date Number */}
                            <div className="flex items-start justify-between mb-2">
                                <span 
                                    className={`
                                        inline-flex items-center justify-center w-7 h-7 text-sm font-medium rounded-full
                                        ${today ? "bg-primary text-white" : ""}
                                        ${!isCurrentMonth ? "text-muted/50" : ""}
                                        ${isSelected && !today ? "bg-primary/20 text-primary" : ""}
                                    `}
                                >
                                    {format(day, "d")}
                                </span>
                                {dayItems.length > 3 && (
                                    <span className="text-[10px] font-medium text-muted px-1.5 py-0.5 rounded bg-elevated">
                                        +{dayItems.length - 3}
                                    </span>
                                )}
                            </div>

                            {/* Events */}
                            <div className="space-y-1">
                                {dayItems.slice(0, 3).map(item => {
                                    const colors = TYPE_COLORS[item.type] || TYPE_COLORS.admin;
                                    const Icon = TYPE_ICONS[item.type] || Clock;
                                    return (
                                        <div 
                                            key={item.id}
                                            className={`
                                                flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-medium
                                                truncate border-l-2 ${colors.bg} ${colors.border}
                                            `}
                                            title={item.name}
                                        >
                                            <Icon size={10} className={colors.text} />
                                            <span className="truncate">{item.name}</span>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Hover indicator */}
                            <div className="absolute inset-0 border-2 border-primary rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity" />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
