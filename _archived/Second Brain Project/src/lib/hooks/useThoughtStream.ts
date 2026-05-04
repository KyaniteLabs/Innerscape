"use client";

import { useState, useCallback, useRef } from "react";
import { CONFIG } from "@/lib/config";

/**
 * SSE Event types from the streaming capture API
 */
export interface ThoughtEvent {
    type: "thinking" | "tool" | "result" | "done" | "error" | "status";
    content: string;
    metadata?: {
        tool?: string;
        args?: string;
        confidence?: number;
        destination?: string;
        destinationId?: string;
        summary?: string;
        firstStep?: string;
        inboxId?: string;
    };
    timestamp: number;
}

/**
 * Final result after streaming completes
 */
export interface StreamResult {
    success: boolean;
    inboxId?: string;
    destination?: string;
    destinationId?: string;
    confidence?: number;
    summary?: string;
    firstStep?: string;
    error?: string;
}

/**
 * Stream state
 */
export type StreamState = "idle" | "connecting" | "streaming" | "done" | "error";

/**
 * Hook for managing thought stream state
 */
export function useThoughtStream() {
    const [state, setState] = useState<StreamState>("idle");
    const [thoughts, setThoughts] = useState<ThoughtEvent[]>([]);
    const [result, setResult] = useState<StreamResult | null>(null);
    const [isExpanded, setIsExpanded] = useState(true);
    
    const abortControllerRef = useRef<AbortController | null>(null);

    /**
     * Start streaming capture
     */
    const startStream = useCallback(async (text: string, source: string = "web"): Promise<StreamResult> => {
        // Reset state
        setThoughts([]);
        setResult(null);
        setState("connecting");
        setIsExpanded(true);

        // Create abort controller for cleanup
        abortControllerRef.current = new AbortController();

        return new Promise((resolve) => {
            // Use fetch with streaming instead of EventSource for POST support
            fetch("/api/capture/stream", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ text, source }),
                signal: abortControllerRef.current?.signal,
            })
                .then(async (response) => {
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}`);
                    }

                    const reader = response.body?.getReader();
                    if (!reader) {
                        throw new Error("No response body");
                    }

                    setState("streaming");
                    const decoder = new TextDecoder();
                    let buffer = "";

                    while (true) {
                        const { done, value } = await reader.read();
                        
                        if (done) {
                            break;
                        }

                        buffer += decoder.decode(value, { stream: true });
                        
                        // Process complete SSE messages
                        const lines = buffer.split("\n");
                        buffer = lines.pop() || ""; // Keep incomplete line in buffer

                        for (const line of lines) {
                            if (line.startsWith("data: ")) {
                                try {
                                    const data = JSON.parse(line.slice(6));
                                    const event: ThoughtEvent = {
                                        ...data,
                                        timestamp: Date.now(),
                                    };

                                    setThoughts((prev) => {
                                        if (prev.length === 0) return [event];
                                        
                                        const last = prev[prev.length - 1];
                                        // Aggregate consecutive 'thinking' or 'status' updates to avoid word-sprawl
                                        if (
                                            (event.type === "thinking" || event.type === "status") && 
                                            last.type === event.type &&
                                            // Only aggregate if they don't have distinct metadata (like different tools)
                                            !event.metadata?.tool && !last.metadata?.tool
                                        ) {
                                            const updated = [...prev];
                                            updated[updated.length - 1] = {
                                                ...last,
                                                content: last.content + event.content,
                                                timestamp: event.timestamp,
                                            };
                                            return updated;
                                        }
                                        
                                        return [...prev, event];
                                    });

                                    // Handle terminal events
                                    if (event.type === "done") {
                                        const streamResult: StreamResult = {
                                            success: true,
                                            inboxId: event.metadata?.inboxId,
                                            destination: event.metadata?.destination,
                                            destinationId: event.metadata?.destinationId,
                                            confidence: event.metadata?.confidence,
                                            summary: event.metadata?.summary,
                                            firstStep: event.metadata?.firstStep,
                                        };
                                        setResult(streamResult);
                                        setState("done");
                                        
                                        // Auto-collapse after a short delay
                                        setTimeout(() => setIsExpanded(false), CONFIG.UI.THOUGHT_STREAM.AUTO_COLLAPSE_DELAY_MS);
                                        
                                        resolve(streamResult);
                                    } else if (event.type === "error") {
                                        const streamResult: StreamResult = {
                                            success: false,
                                            error: event.content,
                                        };
                                        setResult(streamResult);
                                        setState("error");
                                        resolve(streamResult);
                                    }
                                } catch (parseError) {
                                    // Skip malformed JSON - this can happen with partial SSE chunks
                                    if (process.env.NODE_ENV === "development") {
                                        console.debug("[APEX] [ThoughtStream] Skipped malformed JSON chunk");
                                    }
                                }
                            }
                        }
                    }
                })
                .catch((error) => {
                    if (error.name === "AbortError") {
                        // Cancelled by user
                        setState("idle");
                        resolve({ success: false, error: "Cancelled" });
                    } else {
                        const streamResult: StreamResult = {
                            success: false,
                            error: error.message || "Stream failed",
                        };
                        setResult(streamResult);
                        setState("error");
                        resolve(streamResult);
                    }
                });
        });
    }, []);

    /**
     * Cancel ongoing stream
     */
    const cancel = useCallback(() => {
        abortControllerRef.current?.abort();
        setState("idle");
    }, []);

    /**
     * Reset to initial state
     */
    const reset = useCallback(() => {
        cancel();
        setThoughts([]);
        setResult(null);
        setState("idle");
        setIsExpanded(true);
    }, [cancel]);

    /**
     * Toggle expanded state
     */
    const toggleExpanded = useCallback(() => {
        setIsExpanded((prev) => !prev);
    }, []);

    return {
        // State
        state,
        thoughts,
        result,
        isExpanded,
        
        // Derived state
        isActive: state === "connecting" || state === "streaming",
        isDone: state === "done",
        hasError: state === "error",
        
        // Actions
        startStream,
        cancel,
        reset,
        toggleExpanded,
    };
}
