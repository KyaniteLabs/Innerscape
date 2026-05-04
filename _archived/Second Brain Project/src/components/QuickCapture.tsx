"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { 
    Mic, Send, Loader2, Zap, Keyboard, AlertCircle, CheckCircle, 
    Brain, Link2, Sparkles, HelpCircle, X, Sunrise, Sun, Moon
} from "lucide-react";
import { useWhisper } from "@/lib/hooks/useWhisper";
import { useToast } from "@/lib/hooks/useToast";
import { useTimeContext } from "@/lib/hooks/useAppContext";
import { useThoughtStream } from "@/lib/hooks/useThoughtStream";
import { SuccessCheck, GlowPulse } from "@/components/Celebrations";
import { ThoughtStream } from "@/components/ThoughtStream";
import { CONFIG } from "@/lib/config";

interface QuickCaptureProps {
    /** Auto-start voice recording on mount (for voice-first mode) */
    autoStartVoice?: boolean;
    /** Callback after successful capture (for refreshing parent data) */
    onCaptureSuccess?: () => void;
    /** Whether to use streaming capture (defaults to true) */
    useStreaming?: boolean;
}

// Types for agent response
interface AgentResult {
    action: "filed" | "clarify" | "error";
    destination?: string;
    summary?: string;
    firstStep?: string;
    related?: Array<{ name: string; type: string; relevance: string }>;
    question?: string;
    options?: string[];
    error?: string;
}

// Pending clarification state
interface PendingClarification {
    originalText: string;
    question: string;
    options?: string[];
}

// Processing phases for ADHD-friendly progress
type ProcessingPhase = "idle" | "thinking" | "searching" | "filing" | "done" | "clarifying";

const PHASE_MESSAGES: Record<ProcessingPhase, string> = {
    idle: "",
    thinking: "Understanding...",
    searching: "Finding connections...",
    filing: "Organizing...",
    done: "Done!",
    clarifying: "Quick question...",
};

// Time-aware placeholders
const TIME_PLACEHOLDERS = {
    morning: "What's on your mind this morning?",
    afternoon: "Capture a thought or task...",
    evening: "Anything to wrap up today?",
    night: "One last thought before rest?",
};

// Time-aware icons
const TIME_ICONS = {
    morning: Sunrise,
    afternoon: Sun,
    evening: Sun,
    night: Moon,
};

export function QuickCapture({ autoStartVoice = false, onCaptureSuccess, useStreaming: useStreamingProp = true }: QuickCaptureProps) {
    const [text, setText] = useState("");
    const { isReady, isRecording, transcript, error: whisperError, startRecording, stopRecording, clearError } = useWhisper();
    const [isSaving, setIsSaving] = useState(false);
    const [phase, setPhase] = useState<ProcessingPhase>("idle");
    const [result, setResult] = useState<AgentResult | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
    const [pendingClarification, setPendingClarification] = useState<PendingClarification | null>(null);
    const [isFocused, setIsFocused] = useState(false);
    const [useStreaming, setUseStreaming] = useState(useStreamingProp); // Use prop value for initial state
    const originalTextRef = useRef<string>("");
    const hasAutoStarted = useRef(false);
    const { success, error: showError } = useToast();
    const { timeOfDay, isLateNight } = useTimeContext();
    
    // Thought stream for showing agent's thinking process
    const thoughtStream = useThoughtStream();

    // Sync streaming state if prop changes
    useEffect(() => {
        setUseStreaming(useStreamingProp);
    }, [useStreamingProp]);

    // Get time-aware placeholder
    const placeholder = useMemo(() => {
        if (pendingClarification) return "Type your answer...";
        return TIME_PLACEHOLDERS[timeOfDay];
    }, [pendingClarification, timeOfDay]);

    // Time icon component
    const TimeIcon = TIME_ICONS[timeOfDay];

    // Auto-start voice recording if prop is true
    useEffect(() => {
        if (autoStartVoice && isReady && !hasAutoStarted.current && !isRecording) {
            hasAutoStarted.current = true;
            const timer = setTimeout(() => {
                startRecording();
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [autoStartVoice, isReady, isRecording, startRecording]);

    const handleCapture = async (capturedText?: string, clarificationAnswer?: string) => {
        const finalText = capturedText || text;
        if (!finalText.trim() && !clarificationAnswer) return;

        // Store original text for clarification flow
        if (!clarificationAnswer) {
            originalTextRef.current = finalText;
        }

        const textToCapture = clarificationAnswer 
            ? `${originalTextRef.current}\n\n[User clarification: ${clarificationAnswer}]`
            : finalText;
        const source = capturedText ? "voice" : "web";

        setIsSaving(true);
        setResult(null);
        setShowResult(false);
        setPendingClarification(null);
        setPhase("thinking");

        // Use streaming capture for real-time thought display
        if (useStreaming) {
            try {
                const streamResult = await thoughtStream.startStream(textToCapture, source);
                
                setText("");
                setPhase("done");
                
                if (streamResult.success) {
                    // Build result from stream response
                    const agentResult: AgentResult = {
                        action: "filed",
                        destination: streamResult.destination,
                        summary: streamResult.summary || `Captured to ${streamResult.destination}`,
                        firstStep: streamResult.firstStep,
                    };
                    
                    setResult(agentResult);
                    setShowResult(true);
                    
                    // Show brief toast and success animation
                    if (streamResult.destination && streamResult.destination !== "needs_review") {
                        success("Got it!");
                        setShowSuccessAnimation(true);
                        setTimeout(() => setShowSuccessAnimation(false), CONFIG.UI.CAPTURE.ANIMATION_DELAY_MS);
                    } else if (streamResult.destination === "needs_review") {
                        success("Captured - take a look when you can");
                    }

                    // Notify parent to refresh data
                    onCaptureSuccess?.();

                    // Auto-hide result after delay
                    setTimeout(() => {
                        setShowResult(false);
                        setPhase("idle");
                    }, CONFIG.UI.CAPTURE.AUTO_DISMISS_DELAY_MS);
                } else {
                    setPhase("idle");
                    showError(streamResult.error || "Capture failed");
                }
            } catch (e) {
                console.error("[APEX] [QuickCapture] Stream capture failed:", e);
                setPhase("idle");
                showError(e instanceof Error ? e.message : "Failed to capture");
            } finally {
                setIsSaving(false);
            }
            return;
        }

        // Non-streaming fallback
        try {
            // Simulate phase progression for user feedback
            const phaseTimeout = setTimeout(() => setPhase("searching"), CONFIG.UI.CAPTURE.ANIMATION_DELAY_MS);
            const phase2Timeout = setTimeout(() => setPhase("filing"), CONFIG.UI.CAPTURE.PHASE_TRANSITION_DELAY_MS);

            // Build request body
            const requestBody: Record<string, unknown> = {
                text: textToCapture,
                source,
                stream: false,
            };

            const res = await fetch("/api/capture", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestBody),
            });
            
            clearTimeout(phaseTimeout);
            clearTimeout(phase2Timeout);

            const data = await res.json();
            
            if (!res.ok || !data.success) {
                throw new Error(data.message || data.error || "Capture failed");
            }
            
            // Handle clarification request from agent
            if (data.action === "clarify" && data.question) {
                setPhase("clarifying");
                setPendingClarification({
                    originalText: originalTextRef.current,
                    question: data.question,
                    options: data.options,
                });
                setText(""); // Clear input for answer
                setIsSaving(false);
                return;
            }
            
            setText("");
            setPhase("done");
            
            // Build result from response
            const agentResult: AgentResult = {
                action: data.action || "filed",
                destination: data.destination,
                summary: data.summary || `Captured to ${data.destination}`,
                firstStep: data.firstStep || data.first_step,
                related: data.related,
                question: data.question,
                options: data.options,
            };
            
            setResult(agentResult);
            setShowResult(true);
            
            // Show brief toast and success animation
            if (data.destination && data.destination !== "needs_review") {
                success("Got it!");
                setShowSuccessAnimation(true);
                setTimeout(() => setShowSuccessAnimation(false), CONFIG.UI.CAPTURE.ANIMATION_DELAY_MS);
            } else if (data.destination === "needs_review") {
                success("Captured - take a look when you can");
            }

            // Notify parent to refresh data
            onCaptureSuccess?.();

            // Auto-hide result after delay
            setTimeout(() => {
                setShowResult(false);
                setPhase("idle");
            }, CONFIG.UI.CAPTURE.AUTO_DISMISS_DELAY_MS);

        } catch (e) {
            console.error("[APEX] [QuickCapture] Capture failed:", e);
            setPhase("idle");
            showError(e instanceof Error ? e.message : "Failed to capture");
        } finally {
            setIsSaving(false);
        }
    };

    // Handle clicking a clarification option
    const handleClarificationOption = (option: string) => {
        handleCapture(undefined, option);
    };

    // Cancel clarification and save to needs_review
    const cancelClarification = () => {
        setPendingClarification(null);
        setPhase("idle");
        success("Saved to inbox for later review");
    };

    const handleVoiceCapture = useCallback(() => {
        if (isRecording) {
            stopRecording();
            if (transcript.trim()) {
                handleCapture(transcript);
            }
        } else {
            clearError();
            startRecording();
        }
    }, [isRecording, transcript, clearError, startRecording, stopRecording]);

    const dismissResult = () => {
        setShowResult(false);
        setPhase("idle");
        setResult(null);
    };

    return (
        <GlowPulse isActive={isFocused || isRecording} color="var(--primary)">
        <div className={`card relative capture-glow card-shine ${isFocused ? 'border-primary' : ''}`} style={{ 
            transition: 'all 0.2s ease',
            boxShadow: isFocused ? 'var(--glow-primary)' : undefined,
            background: isFocused ? 'linear-gradient(135deg, rgba(var(--primary-rgb), 0.05), var(--bg-surface))' : undefined
        }}>
            {/* Whisper Error */}
            {whisperError && (
                <div className="flex items-center gap-2 mb-3 animate-slideIn badge-destructive p-2 rounded-lg">
                    <AlertCircle size={16} />
                    <span className="text-sm flex-1">
                        {whisperError.message}
                    </span>
                    <button 
                        onClick={clearError}
                        className="text-xs opacity-70 hover:opacity-100 btn-ghost p-1"
                    >
                        Dismiss
                    </button>
                </div>
            )}

            {/* Recording Indicator */}
            {isRecording && (
                <div className="flex items-center gap-2 mb-3 animate-slideIn badge-accent p-2 rounded-lg">
                    <div className="flex gap-1">
                        {[1, 2, 3].map(i => (
                            <div
                                key={i}
                                className="animate-pulse w-1 h-4 rounded-sm"
                                style={{ 
                                    background: 'currentColor', 
                                    animationDelay: `${i * 0.15}s`
                                }}
                            />
                        ))}
                    </div>
                    <span className="text-sm font-medium">Listening...</span>
                </div>
            )}

            {/* Thought Stream - Shows agent's thinking process */}
            {useStreaming && (thoughtStream.isActive || thoughtStream.isDone || thoughtStream.hasError) && (
                <div className="mb-3">
                    <ThoughtStream
                        state={thoughtStream.state}
                        thoughts={thoughtStream.thoughts}
                        result={thoughtStream.result}
                        isExpanded={thoughtStream.isExpanded}
                        onToggleExpanded={thoughtStream.toggleExpanded}
                    />
                </div>
            )}

            {/* Processing Indicator - Fallback for non-streaming mode */}
            {!useStreaming && isSaving && phase !== "idle" && phase !== "done" && phase !== "clarifying" && (
                <div className="flex items-center gap-3 mb-3 animate-slideIn p-3 rounded-lg bg-primary/10">
                    <Brain size={18} className="text-primary animate-pulse" />
                    <div className="flex-1">
                        <span className="text-sm font-medium">{PHASE_MESSAGES[phase]}</span>
                        <div className="mt-1 h-1 bg-muted rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-primary transition-all duration-500 ease-out rounded-full"
                                style={{ 
                                    width: phase === "thinking" ? "33%" : phase === "searching" ? "66%" : "90%"
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Clarification Request - ADHD Friendly (one simple question) */}
            {pendingClarification && (
                <div className="mb-3 animate-slideIn p-3 rounded-lg border border-accent/30 bg-accent/5">
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2">
                            <HelpCircle size={18} className="text-accent mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-sm font-medium">
                                    {pendingClarification.question}
                                </p>
                                <p className="text-xs text-muted mt-1">
                                    "{pendingClarification.originalText.substring(0, 40)}..."
                                </p>
                            </div>
                        </div>
                        <button 
                            onClick={cancelClarification}
                            className="btn-ghost p-1 rounded"
                            title="Skip and save to inbox"
                        >
                            <X size={14} />
                        </button>
                    </div>

                    {/* Quick Options (max 3) */}
                    {pendingClarification.options && pendingClarification.options.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                            {pendingClarification.options.slice(0, 3).map((option, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleClarificationOption(option)}
                                    className="px-3 py-1.5 text-sm rounded-full border border-accent/40 hover:bg-accent/20 transition-colors"
                                    disabled={isSaving}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Or type custom answer hint */}
                    <p className="text-[10px] text-muted mt-3 opacity-60">
                        Or type your answer below
                    </p>
                </div>
            )}

            {/* Agent Result - ADHD Optimized Display */}
            {showResult && result && (
                <div 
                    className="mb-3 animate-slideIn p-3 rounded-lg border border-success/30 bg-success/5"
                    onClick={dismissResult}
                    role="button"
                    tabIndex={0}
                >
                    {/* Summary */}
                    <div className="flex items-start gap-2">
                        <CheckCircle size={18} className="text-success mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">
                                {result.summary}
                            </p>
                            {result.destination && (
                                <p className="text-xs text-muted mt-0.5">
                                    → {result.destination}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* First Step - The Key ADHD Feature */}
                    {result.firstStep && (
                        <div className="mt-3 pt-3 border-t border-success/20">
                            <div className="flex items-center gap-2">
                                <Sparkles size={14} className="text-accent" />
                                <span className="text-xs font-medium text-muted">First tiny step:</span>
                            </div>
                            <p className="mt-1 text-sm font-medium pl-5">
                                {result.firstStep}
                            </p>
                        </div>
                    )}

                    {/* Related Items */}
                    {result.related && result.related.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-success/20">
                            <div className="flex items-center gap-2 mb-2">
                                <Link2 size={14} className="text-muted" />
                                <span className="text-xs text-muted">Related:</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {result.related.slice(0, 3).map((item, i) => (
                                    <span 
                                        key={i}
                                        className="text-xs px-2 py-1 rounded-full bg-muted/30"
                                        title={item.relevance}
                                    >
                                        {item.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Tap to dismiss hint */}
                    <p className="text-[10px] text-muted text-center mt-3 opacity-50">
                        tap to dismiss
                    </p>
                </div>
            )}

            {/* Input Area */}
            <div className="flex gap-3">
                <textarea
                    value={isRecording ? transcript : text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={placeholder}
                    className="input"
                    style={{ minHeight: '60px' }}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                            e.preventDefault();
                            if (pendingClarification) {
                                handleCapture(undefined, text);
                            } else {
                                handleCapture();
                            }
                        }
                    }}
                    disabled={isSaving}
                />

                <div className="flex gap-2 pt-1">
                    <button
                        onClick={handleVoiceCapture}
                        className={`btn ${isRecording ? 'bg-accent' : 'btn-ghost'}`}
                        style={isRecording ? { color: 'white' } : {}}
                        title={isRecording ? "Stop recording" : "Start voice capture"}
                        disabled={isSaving || !!pendingClarification}
                    >
                        <Mic size={18} />
                    </button>

                    <button
                        onClick={() => {
                            if (pendingClarification) {
                                handleCapture(undefined, text);
                            } else {
                                handleCapture();
                            }
                        }}
                        disabled={!text.trim() || isSaving}
                        className="btn btn-primary"
                        style={{ opacity: (!text.trim() || isSaving) ? 0.3 : 1 }}
                        title={pendingClarification ? "Send answer (⌘+Enter)" : "Save capture (⌘+Enter)"}
                    >
                        {isSaving ? (
                            <Loader2 size={18} className="animate-spin" />
                        ) : (
                            <Send size={18} />
                        )}
                    </button>
                </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t">
                <div className="flex items-center gap-2 text-xs text-muted">
                    <TimeIcon size={12} className="text-primary" />
                    <button
                        onClick={() => setUseStreaming(!useStreaming)}
                        className={`flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors ${
                            useStreaming 
                                ? 'bg-primary/20 text-primary' 
                                : 'hover:bg-elevated'
                        }`}
                        title={useStreaming ? "Streaming enabled - click to disable" : "Streaming disabled - click to enable"}
                        aria-label={useStreaming ? "Disable thought stream" : "Enable thought stream"}
                    >
                        <Brain size={12} />
                        <span className="hidden sm:inline">
                            {useStreaming ? "Thinking visible" : "Thinking hidden"}
                        </span>
                    </button>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted">
                    <Keyboard size={12} />
                    <span className="font-mono">⌘+Enter</span>
                    {isLateNight && (
                        <span className="ml-2 text-warning">• Late night mode</span>
                    )}
                </div>
            </div>

            {/* Success Animation Overlay */}
            {showSuccessAnimation && (
                <div className="absolute inset-0 flex items-center justify-center bg-bg/50 rounded-lg pointer-events-none">
                    <SuccessCheck isVisible={showSuccessAnimation} size={64} />
                </div>
            )}
        </div>
        </GlowPulse>
    );
}
