"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Mic, MicOff, CheckCircle, AlertCircle, Loader2, Home } from "lucide-react";
import { useWhisper } from "@/lib/hooks/useWhisper";
import Link from "next/link";

type CaptureState = "ready" | "recording" | "processing" | "success" | "error";

/**
 * Voice Capture Page
 * 
 * Minimal, voice-first interface for quick thought capture.
 * Auto-starts recording on page load for maximum speed.
 * 
 * Usage:
 * - Direct URL: /voice
 * - PWA Shortcut: "Voice Capture"
 * - iOS Siri Shortcut: Opens this page
 */
export default function VoicePage() {
    const { isReady, isRecording, transcript, error: whisperError, startRecording, stopRecording, clearError } = useWhisper();
    const [state, setState] = useState<CaptureState>("ready");
    const [message, setMessage] = useState("");
    const [summary, setSummary] = useState("");
    const hasAutoStarted = useRef(false);

    // Auto-start recording when page loads and whisper is ready
    useEffect(() => {
        if (isReady && !hasAutoStarted.current && state === "ready") {
            hasAutoStarted.current = true;
            // Small delay to ensure permissions dialog isn't jarring
            const timer = setTimeout(() => {
                startRecording();
                setState("recording");
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [isReady, state, startRecording]);

    // Handle transcript received
    useEffect(() => {
        if (transcript && state === "recording") {
            handleCapture(transcript);
        }
    }, [transcript, state]);

    // Handle whisper errors
    useEffect(() => {
        if (whisperError) {
            setState("error");
            setMessage(whisperError.message);
        }
    }, [whisperError]);

    // Update recording state from hook
    useEffect(() => {
        if (!isRecording && state === "recording" && !transcript) {
            // Recording stopped but no transcript yet - wait for processing
        }
    }, [isRecording, state, transcript]);

    const handleCapture = async (text: string) => {
        if (!text.trim()) {
            setState("error");
            setMessage("No speech detected. Tap to try again.");
            return;
        }

        setState("processing");
        setMessage("Processing...");

        try {
            const res = await fetch("/api/capture", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    text,
                    source: "voice",
                    stream: false,
                }),
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data.error || "Capture failed");
            }

            setState("success");
            setSummary(data.summary || text.slice(0, 50));
            setMessage(data.firstStep || "Captured!");

            // Vibrate on success (mobile)
            if (navigator.vibrate) {
                navigator.vibrate(100);
            }
        } catch (err) {
            setState("error");
            setMessage(err instanceof Error ? err.message : "Something went wrong");
        }
    };

    const handleTap = () => {
        clearError();
        
        if (state === "recording" && isRecording) {
            stopRecording();
        } else if (state === "success" || state === "error" || state === "ready") {
            setState("recording");
            setSummary("");
            setMessage("");
            startRecording();
        }
    };

    const getStateConfig = () => {
        switch (state) {
            case "ready":
                return {
                    icon: <Mic className="w-20 h-20" />,
                    color: "text-muted",
                    bgColor: "bg-muted/20",
                    pulseColor: "",
                    label: "Tap to start",
                };
            case "recording":
                return {
                    icon: <MicOff className="w-20 h-20" />,
                    color: "text-red-500",
                    bgColor: "bg-red-500/20",
                    pulseColor: "animate-pulse ring-4 ring-red-500/50",
                    label: "Tap when done",
                };
            case "processing":
                return {
                    icon: <Loader2 className="w-20 h-20 animate-spin" />,
                    color: "text-primary",
                    bgColor: "bg-primary/20",
                    pulseColor: "",
                    label: "Processing...",
                };
            case "success":
                return {
                    icon: <CheckCircle className="w-20 h-20" />,
                    color: "text-green-500",
                    bgColor: "bg-green-500/20",
                    pulseColor: "",
                    label: "Captured!",
                };
            case "error":
                return {
                    icon: <AlertCircle className="w-20 h-20" />,
                    color: "text-red-500",
                    bgColor: "bg-red-500/20",
                    pulseColor: "",
                    label: "Tap to retry",
                };
        }
    };

    const config = getStateConfig();

    return (
        <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
            {/* Home link */}
            <Link 
                href="/" 
                className="absolute top-4 left-4 p-2 text-muted hover:text-foreground transition-colors"
                aria-label="Go to home"
            >
                <Home className="w-6 h-6" />
            </Link>

            {/* Main capture button */}
            <button
                onClick={handleTap}
                disabled={state === "processing"}
                className={`
                    relative w-48 h-48 rounded-full 
                    flex items-center justify-center
                    transition-all duration-300 ease-out
                    ${config.bgColor} ${config.color} ${config.pulseColor}
                    disabled:opacity-50 disabled:cursor-not-allowed
                    active:scale-95
                    focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background
                `}
                aria-label={config.label}
            >
                {config.icon}
            </button>

            {/* Status label */}
            <p className="mt-6 text-lg font-medium text-foreground">
                {config.label}
            </p>

            {/* Summary (on success) */}
            {state === "success" && summary && (
                <div className="mt-6 max-w-xs text-center animate-in fade-in slide-in-from-bottom-2">
                    <p className="text-sm text-muted mb-2">Captured:</p>
                    <p className="text-foreground font-medium">{summary}</p>
                    {message && message !== "Captured!" && (
                        <p className="mt-2 text-sm text-primary">
                            First step: {message}
                        </p>
                    )}
                </div>
            )}

            {/* Error message */}
            {state === "error" && message && (
                <p className="mt-4 text-sm text-red-500 text-center max-w-xs animate-in fade-in">
                    {message}
                </p>
            )}

            {/* Instructions (when idle/ready) */}
            {state === "ready" && (
                <p className="mt-8 text-sm text-muted text-center max-w-xs">
                    Speak your thought clearly. Recording will start automatically.
                </p>
            )}

            {/* Recording indicator */}
            {state === "recording" && (
                <div className="mt-8 flex items-center gap-2 text-red-500 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-sm">Recording...</span>
                </div>
            )}

            {/* Capture another button (after success) */}
            {state === "success" && (
                <button
                    onClick={handleTap}
                    className="mt-8 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
                >
                    Capture another
                </button>
            )}
        </main>
    );
}
