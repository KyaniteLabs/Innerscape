"use client";

import { useMemo } from "react";
import { Flame, TrendingUp, TrendingDown, Minus, Activity, Calendar, Target, Zap } from "lucide-react";

// ===== COMPLETION RING (Apple Fitness style) =====

interface CompletionRingProps {
    progress: number; // 0-100
    size?: number;
    strokeWidth?: number;
    color?: string;
    backgroundColor?: string;
    showPercentage?: boolean;
    label?: string;
    icon?: React.ReactNode;
}

export function CompletionRing({
    progress,
    size = 120,
    strokeWidth = 10,
    color = "var(--primary)",
    backgroundColor = "var(--bg-elevated)",
    showPercentage = true,
    label,
    icon,
}: CompletionRingProps) {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (Math.min(progress, 100) / 100) * circumference;

    return (
        <div className="relative inline-flex items-center justify-center">
            <svg
                width={size}
                height={size}
                className="transform -rotate-90"
            >
                {/* Background circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={backgroundColor}
                    strokeWidth={strokeWidth}
                />
                {/* Progress circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={`url(#ring-gradient-${size})`}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    style={{
                        transition: "stroke-dashoffset 0.5s ease-out",
                    }}
                />
                {/* Gradient definition */}
                <defs>
                    <linearGradient id={`ring-gradient-${size}`} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={color} />
                        <stop offset="100%" stopColor="var(--primary-light)" />
                    </linearGradient>
                </defs>
            </svg>
            
            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                {icon && <div className="mb-1 text-primary">{icon}</div>}
                {showPercentage && (
                    <span 
                        className="text-2xl font-bold"
                        style={{ color }}
                    >
                        {Math.round(progress)}%
                    </span>
                )}
                {label && (
                    <span className="text-xs text-muted">{label}</span>
                )}
            </div>
        </div>
    );
}

// ===== MULTI RING (Multiple metrics) =====

interface RingData {
    progress: number;
    color: string;
    label: string;
}

interface MultiRingProps {
    rings: RingData[];
    size?: number;
}

export function MultiRing({ rings, size = 140 }: MultiRingProps) {
    const strokeWidth = 8;
    const gap = 4;

    return (
        <div className="relative inline-flex items-center justify-center">
            <svg width={size} height={size} className="transform -rotate-90">
                {rings.map((ring, index) => {
                    const radius = (size - strokeWidth) / 2 - (index * (strokeWidth + gap));
                    const circumference = radius * 2 * Math.PI;
                    const offset = circumference - (Math.min(ring.progress, 100) / 100) * circumference;

                    return (
                        <g key={index}>
                            {/* Background */}
                            <circle
                                cx={size / 2}
                                cy={size / 2}
                                r={radius}
                                fill="none"
                                stroke="var(--bg-elevated)"
                                strokeWidth={strokeWidth}
                            />
                            {/* Progress */}
                            <circle
                                cx={size / 2}
                                cy={size / 2}
                                r={radius}
                                fill="none"
                                stroke={ring.color}
                                strokeWidth={strokeWidth}
                                strokeLinecap="round"
                                strokeDasharray={circumference}
                                strokeDashoffset={offset}
                                style={{
                                    transition: "stroke-dashoffset 0.5s ease-out",
                                    filter: `drop-shadow(0 0 6px ${ring.color}40)`,
                                }}
                            />
                        </g>
                    );
                })}
            </svg>
            
            {/* Center content */}
            <div className="absolute inset-0 flex items-center justify-center">
                <Target size={24} className="text-primary" />
            </div>
        </div>
    );
}

// ===== ACTIVITY HEATMAP (GitHub style) =====

interface HeatmapData {
    date: string;
    count: number;
}

interface ActivityHeatmapProps {
    data: HeatmapData[];
    weeks?: number;
    colorScale?: string[];
    showLabels?: boolean;
}

export function ActivityHeatmap({
    data,
    weeks = 12,
    colorScale = [
        "var(--bg-elevated)",
        "rgba(var(--primary-rgb), 0.2)",
        "rgba(var(--primary-rgb), 0.4)",
        "rgba(var(--primary-rgb), 0.6)",
        "rgba(var(--primary-rgb), 0.8)",
        "var(--primary)",
    ],
    showLabels = true,
}: ActivityHeatmapProps) {
    const days = useMemo(() => {
        const result: { date: Date; count: number }[] = [];
        const today = new Date();
        const totalDays = weeks * 7;
        
        for (let i = totalDays - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split("T")[0];
            const found = data.find((d) => d.date === dateStr);
            result.push({
                date,
                count: found?.count || 0,
            });
        }
        
        return result;
    }, [data, weeks]);

    const maxCount = useMemo(() => Math.max(...days.map((d) => d.count), 1), [days]);

    const getColor = (count: number) => {
        if (count === 0) return colorScale[0];
        const index = Math.min(
            Math.ceil((count / maxCount) * (colorScale.length - 1)),
            colorScale.length - 1
        );
        return colorScale[index];
    };

    const dayLabels = ["", "Mon", "", "Wed", "", "Fri", ""];

    // Group by weeks
    const weekGroups: { date: Date; count: number }[][] = [];
    for (let i = 0; i < days.length; i += 7) {
        weekGroups.push(days.slice(i, i + 7));
    }

    return (
        <div className="flex gap-1">
            {showLabels && (
                <div className="flex flex-col gap-0.5 text-[10px] text-muted mr-1">
                    {dayLabels.map((label, i) => (
                        <div key={i} className="h-3 flex items-center">{label}</div>
                    ))}
                </div>
            )}
            
            <div className="flex gap-0.5">
                {weekGroups.map((week, weekIndex) => (
                    <div key={weekIndex} className="flex flex-col gap-0.5">
                        {week.map((day, dayIndex) => (
                            <div
                                key={dayIndex}
                                className="w-3 h-3 rounded-sm transition-all hover:scale-125 cursor-pointer"
                                style={{ 
                                    backgroundColor: getColor(day.count),
                                    boxShadow: day.count > 0 ? `0 0 4px ${getColor(day.count)}` : "none",
                                }}
                                title={`${day.date.toLocaleDateString()}: ${day.count} captures`}
                            />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}

// ===== STAT CARD =====

interface StatCardProps {
    label: string;
    value: number | string;
    trend?: number; // Positive = up, negative = down, 0 = no change
    trendLabel?: string;
    icon?: React.ReactNode;
    gradient?: string;
    size?: "sm" | "md" | "lg";
}

export function StatCard({
    label,
    value,
    trend,
    trendLabel,
    icon,
    gradient = "var(--gradient-primary-subtle)",
    size = "md",
}: StatCardProps) {
    const TrendIcon = trend && trend > 0 ? TrendingUp : trend && trend < 0 ? TrendingDown : Minus;
    const trendColor = trend && trend > 0 ? "var(--success)" : trend && trend < 0 ? "var(--destructive)" : "var(--text-muted)";

    const sizeClasses = {
        sm: "p-3",
        md: "p-4",
        lg: "p-6",
    };

    const valueSizes = {
        sm: "text-xl",
        md: "text-2xl",
        lg: "text-4xl",
    };

    return (
        <div 
            className={`card ${sizeClasses[size]} relative overflow-hidden`}
            style={{ background: gradient }}
        >
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs uppercase tracking-wider text-muted font-medium">
                        {label}
                    </span>
                    {icon && (
                        <div className="text-primary opacity-70">{icon}</div>
                    )}
                </div>
                
                <div className={`${valueSizes[size]} font-bold mb-1`}>
                    {typeof value === "number" ? value.toLocaleString() : value}
                </div>
                
                {trend !== undefined && (
                    <div className="flex items-center gap-1 text-sm">
                        <TrendIcon size={14} style={{ color: trendColor }} />
                        <span style={{ color: trendColor }}>
                            {trend > 0 ? "+" : ""}{trend}%
                        </span>
                        {trendLabel && (
                            <span className="text-muted">{trendLabel}</span>
                        )}
                    </div>
                )}
            </div>

            {/* Background decoration */}
            <div 
                className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full opacity-10"
                style={{ background: "var(--primary)" }}
            />
        </div>
    );
}

// ===== STREAK DISPLAY =====

interface StreakDisplayProps {
    currentStreak: number;
    longestStreak: number;
    todayComplete?: boolean;
}

export function StreakDisplay({ currentStreak, longestStreak, todayComplete = false }: StreakDisplayProps) {
    return (
        <div className="card p-4">
            <div className="flex items-center gap-3 mb-4">
                <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ 
                        background: currentStreak > 0 ? "var(--gradient-streak)" : "var(--bg-elevated)",
                        boxShadow: currentStreak > 0 ? "0 0 20px rgba(249, 115, 22, 0.3)" : "none",
                    }}
                >
                    <Flame 
                        size={24} 
                        className={currentStreak > 0 ? "text-white streak-fire" : "text-muted"}
                        fill={currentStreak > 0 ? "currentColor" : "none"}
                    />
                </div>
                
                <div className="flex-1">
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold">{currentStreak}</span>
                        <span className="text-muted">day streak</span>
                    </div>
                    <div className="text-sm text-muted">
                        Best: {longestStreak} days
                    </div>
                </div>
            </div>
            
            {/* Today's status */}
            <div 
                className="flex items-center gap-2 p-2 rounded-lg"
                style={{ 
                    background: todayComplete 
                        ? "rgba(var(--success-rgb), 0.1)" 
                        : "var(--bg-elevated)" 
                }}
            >
                <div 
                    className="w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ 
                        background: todayComplete ? "var(--success)" : "var(--border)",
                    }}
                >
                    {todayComplete && <Zap size={12} className="text-white" />}
                </div>
                <span className="text-sm">
                    {todayComplete ? "Today complete!" : "Capture something today to keep your streak"}
                </span>
            </div>
        </div>
    );
}

// ===== WEEKLY ACTIVITY BAR =====

interface WeeklyActivityProps {
    data: { day: string; count: number }[];
    maxValue?: number;
}

export function WeeklyActivity({ data, maxValue }: WeeklyActivityProps) {
    const max = maxValue || Math.max(...data.map((d) => d.count), 1);

    return (
        <div className="flex items-end gap-1 h-16">
            {data.map((day, index) => {
                const height = (day.count / max) * 100;
                const isToday = index === data.length - 1;

                return (
                    <div key={day.day} className="flex-1 flex flex-col items-center gap-1">
                        <div 
                            className="w-full rounded-t transition-all hover:opacity-80"
                            style={{ 
                                height: `${Math.max(height, 4)}%`,
                                background: isToday 
                                    ? "var(--gradient-primary)" 
                                    : "rgba(var(--primary-rgb), 0.3)",
                                boxShadow: isToday ? "var(--glow-primary)" : "none",
                            }}
                            title={`${day.day}: ${day.count}`}
                        />
                        <span className="text-[10px] text-muted">{day.day.slice(0, 1)}</span>
                    </div>
                );
            })}
        </div>
    );
}

// ===== PRODUCTIVITY SCORE =====

interface ProductivityScoreProps {
    score: number; // 0-100
    change?: number;
    factors?: { label: string; value: number; max: number }[];
}

export function ProductivityScore({ score, change, factors }: ProductivityScoreProps) {
    const getScoreColor = (s: number) => {
        if (s >= 80) return "var(--success)";
        if (s >= 60) return "var(--primary)";
        if (s >= 40) return "var(--warning)";
        return "var(--destructive)";
    };

    return (
        <div className="card p-4">
            <div className="flex items-center gap-4">
                <CompletionRing 
                    progress={score} 
                    size={80}
                    color={getScoreColor(score)}
                    label="Score"
                />
                
                <div className="flex-1">
                    <h3 className="font-semibold mb-1">Productivity Score</h3>
                    {change !== undefined && (
                        <div className="flex items-center gap-1 text-sm">
                            {change > 0 ? (
                                <TrendingUp size={14} className="text-success" />
                            ) : change < 0 ? (
                                <TrendingDown size={14} className="text-destructive" />
                            ) : (
                                <Minus size={14} className="text-muted" />
                            )}
                            <span className={change > 0 ? "text-success" : change < 0 ? "text-destructive" : "text-muted"}>
                                {change > 0 ? "+" : ""}{change}% from last week
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {factors && factors.length > 0 && (
                <div className="mt-4 space-y-2">
                    {factors.map((factor) => (
                        <div key={factor.label}>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-muted">{factor.label}</span>
                                <span>{Math.round((factor.value / factor.max) * 100)}%</span>
                            </div>
                            <div className="progress-bar h-1.5">
                                <div 
                                    className="progress-fill"
                                    style={{ width: `${(factor.value / factor.max) * 100}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ===== ACTIVITY INDICATOR (Small pulsing dot) =====

interface ActivityIndicatorProps {
    isActive: boolean;
    color?: string;
    size?: "sm" | "md" | "lg";
}

export function ActivityIndicator({ isActive, color = "var(--success)", size = "md" }: ActivityIndicatorProps) {
    const sizes = {
        sm: "w-2 h-2",
        md: "w-3 h-3",
        lg: "w-4 h-4",
    };

    return (
        <div className="relative">
            <div 
                className={`${sizes[size]} rounded-full`}
                style={{ backgroundColor: isActive ? color : "var(--border)" }}
            />
            {isActive && (
                <div 
                    className={`absolute inset-0 ${sizes[size]} rounded-full animate-ping opacity-75`}
                    style={{ backgroundColor: color }}
                />
            )}
        </div>
    );
}

// ===== COMPACT STATS ROW =====

interface CompactStatsProps {
    stats: { label: string; value: string | number; icon?: React.ReactNode }[];
}

export function CompactStats({ stats }: CompactStatsProps) {
    return (
        <div className="flex items-center gap-4 p-3 bg-elevated rounded-lg">
            {stats.map((stat, index) => (
                <div key={index} className="flex items-center gap-2">
                    {stat.icon && <div className="text-primary">{stat.icon}</div>}
                    <div>
                        <div className="font-semibold text-sm">{stat.value}</div>
                        <div className="text-xs text-muted">{stat.label}</div>
                    </div>
                    {index < stats.length - 1 && (
                        <div className="w-px h-8 bg-border ml-4" />
                    )}
                </div>
            ))}
        </div>
    );
}
