"use client";

import { useRef, useEffect } from "react";
import { 
    Brain, Wrench, CheckCircle, Sparkles, AlertCircle, 
    ChevronDown, ChevronUp, Loader2, MessageSquare, Target
} from "lucide-react";
import type { ThoughtEvent, StreamState, StreamResult } from "@/lib/hooks/useThoughtStream";

interface ThoughtStreamProps {
    state: StreamState;
    thoughts: ThoughtEvent[];
    result: StreamResult | null;
    isExpanded: boolean;
    onToggleExpanded: () => void;
}

/**
 * ThoughtStream Component
 * 
 * Displays a real-time stream of the agent's thinking process
 * with expand/collapse functionality and distinct styling for each step type.
 */
export function ThoughtStream({
    state,
    thoughts,
    result,
    isExpanded,
    onToggleExpanded,
}: ThoughtStreamProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when new thoughts arrive
    useEffect(() => {
        if (scrollRef.current && isExpanded) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [thoughts, isExpanded]);

    // Don't render if no activity
    if (state === "idle" && thoughts.length === 0) {
        return null;
    }

    // Collapsed summary view
    if (!isExpanded && (state === "done" || state === "error")) {
        return (
            <button
                onClick={onToggleExpanded}
                className="w-full flex items-center justify-between p-3 rounded-lg bg-elevated border border-border hover:bg-hover transition-colors text-left"
                aria-expanded={false}
                aria-label="Expand agent thoughts"
            >
                <div className="flex items-center gap-2">
                    {result?.success ? (
                        <>
                            <div className="icon-box-sm" style={{ background: 'rgba(var(--success-rgb), 0.15)', color: 'var(--success)' }}>
                                <Sparkles size={14} />
                            </div>
                            <span className="text-sm font-medium">
                                {result.destination 
                                    ? `Filed to ${result.destination}` 
                                    : result.summary || "Processed"}
                            </span>
                            {result.confidence && (
                                <span className="text-xs text-muted">
                                    ({result.confidence}% confidence)
                                </span>
                            )}
                        </>
                    ) : (
                        <>
                            <div className="icon-box-sm" style={{ background: 'rgba(var(--destructive-rgb), 0.15)', color: 'var(--destructive)' }}>
                                <AlertCircle size={14} />
                            </div>
                            <span className="text-sm text-destructive">
                                {result?.error || "Processing failed"}
                            </span>
                        </>
                    )}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted">
                    <span>See details</span>
                    <ChevronDown size={14} />
                </div>
            </button>
        );
    }

    return (
        <div className="rounded-lg border border-border bg-surface overflow-hidden">
            {/* Header */}
            <button
                onClick={onToggleExpanded}
                className="w-full flex items-center justify-between p-3 bg-elevated hover:bg-hover transition-colors"
                aria-expanded={isExpanded}
                aria-label={isExpanded ? "Collapse agent thoughts" : "Expand agent thoughts"}
            >
                <div className="flex items-center gap-2">
                    <div 
                        className="icon-box-sm"
                        style={{ 
                            background: state === "error" 
                                ? 'rgba(var(--destructive-rgb), 0.15)' 
                                : 'rgba(var(--primary-rgb), 0.15)',
                            color: state === "error" ? 'var(--destructive)' : 'var(--primary)'
                        }}
                    >
                        {state === "connecting" || state === "streaming" ? (
                            <Brain size={14} className="animate-pulse" />
                        ) : state === "done" ? (
                            <Sparkles size={14} />
                        ) : state === "error" ? (
                            <AlertCircle size={14} />
                        ) : (
                            <Brain size={14} />
                        )}
                    </div>
                    <span className="text-sm font-medium">
                        {state === "connecting" && "Connecting..."}
                        {state === "streaming" && "Agent thinking..."}
                        {state === "done" && (result?.destination ? `Filed to ${result.destination}` : "Complete")}
                        {state === "error" && "Error"}
                    </span>
                    {state === "streaming" && (
                        <Loader2 size={12} className="animate-spin text-muted" />
                    )}
                </div>
                <div className="text-muted">
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
            </button>

            {/* Thought list */}
            {isExpanded && (
                <div 
                    ref={scrollRef}
                    className="max-h-64 overflow-y-auto p-3 space-y-2"
                    role="log"
                    aria-live="polite"
                    aria-label="Agent thought stream"
                >
                    {thoughts.map((thought, index) => (
                        <ThoughtItem key={index} thought={thought} />
                    ))}
                    
                    {/* Loading indicator while streaming */}
                    {state === "streaming" && (
                        <div className="flex items-center gap-2 text-muted animate-pulse">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

/**
 * Individual thought item
 */
function ThoughtItem({ thought }: { thought: ThoughtEvent }) {
    const getIcon = () => {
        switch (thought.type) {
            case "thinking":
                return <MessageSquare size={12} />;
            case "tool":
                return <Wrench size={12} />;
            case "result":
                return <CheckCircle size={12} />;
            case "done":
                return <Sparkles size={12} />;
            case "error":
                return <AlertCircle size={12} />;
            case "status":
                return <Target size={12} />;
            default:
                return <Brain size={12} />;
        }
    };

    const getStyles = () => {
        switch (thought.type) {
            case "thinking":
                return {
                    bg: "rgba(var(--primary-rgb), 0.1)",
                    border: "rgba(var(--primary-rgb), 0.2)",
                    icon: "var(--primary)",
                    text: "var(--text)",
                };
            case "tool":
                return {
                    bg: "rgba(var(--color-projects-rgb), 0.1)",
                    border: "rgba(var(--color-projects-rgb), 0.2)",
                    icon: "var(--color-projects)",
                    text: "var(--text)",
                };
            case "result":
                return {
                    bg: "rgba(var(--success-rgb), 0.1)",
                    border: "rgba(var(--success-rgb), 0.2)",
                    icon: "var(--success)",
                    text: "var(--text-muted)",
                };
            case "done":
                return {
                    bg: "rgba(var(--success-rgb), 0.15)",
                    border: "rgba(var(--success-rgb), 0.3)",
                    icon: "var(--success)",
                    text: "var(--text)",
                };
            case "error":
                return {
                    bg: "rgba(var(--destructive-rgb), 0.1)",
                    border: "rgba(var(--destructive-rgb), 0.2)",
                    icon: "var(--destructive)",
                    text: "var(--destructive)",
                };
            case "status":
                return {
                    bg: "rgba(var(--text-muted), 0.05)",
                    border: "rgba(var(--border), 0.5)",
                    icon: "var(--text-muted)",
                    text: "var(--text-muted)",
                };
            default:
                return {
                    bg: "var(--bg-elevated)",
                    border: "var(--border)",
                    icon: "var(--text-muted)",
                    text: "var(--text)",
                };
        }
    };

    const styles = getStyles();

    return (
        <div
            className="flex items-start gap-2 p-2 rounded-lg text-xs animate-slideIn"
            style={{
                background: styles.bg,
                borderLeft: `2px solid ${styles.border}`,
            }}
        >
            <div 
                className="flex-shrink-0 mt-0.5"
                style={{ color: styles.icon }}
            >
                {getIcon()}
            </div>
            <div className="flex-1 min-w-0">
                <span style={{ color: styles.text }}>
                    {thought.content}
                </span>
                
                {/* Tool metadata */}
                {thought.type === "tool" && thought.metadata?.tool && (
                    <div className="mt-1 font-mono text-[10px] text-muted opacity-70">
                        {thought.metadata.tool}({thought.metadata.args || ""})
                    </div>
                )}
                
                {/* Done metadata */}
                {thought.type === "done" && thought.metadata && (
                    <div className="mt-1 flex items-center gap-2">
                        {thought.metadata.destination && (
                            <span className="badge badge-primary text-[10px]">
                                {thought.metadata.destination}
                            </span>
                        )}
                        {thought.metadata.confidence && (
                            <span className="text-[10px] text-muted">
                                {thought.metadata.confidence}% confidence
                            </span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

/**
 * Compact inline version for smaller spaces
 */
export function ThoughtStreamInline({
    state,
    thoughts,
}: Pick<ThoughtStreamProps, "state" | "thoughts">) {
    const latestThought = thoughts[thoughts.length - 1];

    if (state === "idle" || !latestThought) {
        return null;
    }

    return (
        <div className="flex items-center gap-2 text-xs text-muted animate-fadeIn">
            {state === "streaming" && (
                <Loader2 size={12} className="animate-spin text-primary" />
            )}
            <span className="truncate">{latestThought.content}</span>
        </div>
    );
}
