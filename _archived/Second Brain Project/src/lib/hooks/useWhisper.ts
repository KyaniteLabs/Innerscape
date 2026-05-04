"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export interface WhisperError {
    code: "PERMISSION_DENIED" | "NOT_SUPPORTED" | "WORKER_ERROR" | "RECOGNITION_ERROR" | "UNKNOWN";
    message: string;
}

// Type definitions for Web Speech API (not in all TypeScript libs)
interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
    resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
    error: string;
    message: string;
}

interface SpeechRecognitionInterface extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
    onend: (() => void) | null;
    start(): void;
    stop(): void;
    abort(): void;
}

interface SpeechRecognitionConstructor {
    new(): SpeechRecognitionInterface;
}

// Extend Window interface for webkit speech recognition
declare global {
    interface Window {
        SpeechRecognition?: SpeechRecognitionConstructor;
        webkitSpeechRecognition?: SpeechRecognitionConstructor;
    }
}

/**
 * useWhisper Hook
 * 
 * Provides speech-to-text functionality using:
 * 1. Native Web Speech API (preferred - faster, works in Safari)
 * 2. Whisper.js fallback (for browsers without native support)
 */
export function useWhisper() {
    const [isReady, setIsReady] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [error, setError] = useState<WhisperError | null>(null);
    
    // Native speech recognition
    const recognition = useRef<SpeechRecognitionInterface | null>(null);
    
    // Whisper fallback
    const worker = useRef<Worker | null>(null);
    const mediaRecorder = useRef<MediaRecorder | null>(null);
    const audioChunks = useRef<Blob[]>([]);
    
    // Which method we're using
    const useNative = useRef(true);

    useEffect(() => {
        // Try native Web Speech API first (works great in Safari, Chrome)
        const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition as SpeechRecognitionConstructor | undefined;
        
        if (SpeechRecognitionAPI) {
            console.log("[APEX] [useWhisper] Using native Web Speech API");
            recognition.current = new SpeechRecognitionAPI();
            recognition.current.continuous = false;
            recognition.current.interimResults = false;
            recognition.current.lang = "en-US";
            
            recognition.current.onresult = (event) => {
                const result = event.results[0];
                if (result.isFinal) {
                    const text = result[0].transcript;
                    console.log("[APEX] [useWhisper] Transcription complete:", text.slice(0, 50));
                    setTranscript(text);
                    setIsRecording(false);
                }
            };
            
            recognition.current.onerror = (event) => {
                console.error("[APEX] [useWhisper] Recognition error:", event.error);
                let errorMsg = "Speech recognition error";
                let errorCode: WhisperError["code"] = "RECOGNITION_ERROR";
                
                switch (event.error) {
                    case "not-allowed":
                    case "service-not-allowed":
                        errorCode = "PERMISSION_DENIED";
                        errorMsg = "Microphone access denied. Please allow microphone access.";
                        break;
                    case "no-speech":
                        errorMsg = "No speech detected. Please try again.";
                        break;
                    case "network":
                        errorMsg = "Network error. Please check your connection.";
                        break;
                    case "aborted":
                        // User stopped - not an error
                        setIsRecording(false);
                        return;
                }
                
                setError({ code: errorCode, message: errorMsg });
                setIsRecording(false);
            };
            
            recognition.current.onend = () => {
                setIsRecording(false);
            };
            
            useNative.current = true;
            setIsReady(true);
        } else {
            // Fall back to Whisper worker
            console.log("[APEX] [useWhisper] Native API not available, trying Whisper.js");
            try {
                worker.current = new Worker(new URL("./whisper.worker.ts", import.meta.url), {
                    type: "module",
                });

                worker.current.onmessage = (event) => {
                    const { status, transcript: result, error: workerError } = event.data;
                    if (status === "complete") {
                        setTranscript(result);
                        setIsRecording(false);
                        setError(null);
                    } else if (status === "error") {
                        console.error("[APEX] [useWhisper] Worker error:", workerError);
                        setError({ code: "WORKER_ERROR", message: workerError });
                        setIsRecording(false);
                    }
                };

                useNative.current = false;
                setIsReady(true);
            } catch (e) {
                console.error("[APEX] [useWhisper] Failed to initialize:", e);
                setError({ 
                    code: "NOT_SUPPORTED", 
                    message: "Speech recognition is not supported in this browser" 
                });
            }
        }

        return () => {
            recognition.current?.abort();
            worker.current?.terminate();
        };
    }, []);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const startRecording = useCallback(async () => {
        if (!isReady) return;
        setError(null);
        setTranscript("");
        
        if (useNative.current && recognition.current) {
            // Use native Web Speech API
            try {
                recognition.current.start();
                setIsRecording(true);
                console.log("[APEX] [useWhisper] Started native speech recognition");
            } catch (e) {
                console.error("[APEX] [useWhisper] Failed to start:", e);
                setError({ 
                    code: "RECOGNITION_ERROR", 
                    message: "Failed to start speech recognition. Try again." 
                });
            }
        } else {
            // Use Whisper worker
            if (!navigator.mediaDevices?.getUserMedia) {
                setError({
                    code: "NOT_SUPPORTED",
                    message: "Audio recording is not supported in this browser",
                });
                return;
            }

            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorder.current = new MediaRecorder(stream);
                audioChunks.current = [];

                mediaRecorder.current.ondataavailable = (event) => {
                    audioChunks.current.push(event.data);
                };

                mediaRecorder.current.onstop = async () => {
                    stream.getTracks().forEach(track => track.stop());
                    const audioBlob = new Blob(audioChunks.current, { type: 'audio/wav' });
                    const audioContext = new AudioContext();
                    const arrayBuffer = await audioBlob.arrayBuffer();
                    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                    const audioData = audioBuffer.getChannelData(0);
                    worker.current?.postMessage({ audio: audioData });
                };

                mediaRecorder.current.start();
                setIsRecording(true);
                console.log("[APEX] [useWhisper] Started Whisper recording");
            } catch (e) {
                console.error("[APEX] [useWhisper] Failed to start recording:", e);
                if ((e as Error).name === "NotAllowedError") {
                    setError({
                        code: "PERMISSION_DENIED",
                        message: "Microphone access denied. Please allow microphone access.",
                    });
                } else {
                    setError({
                        code: "UNKNOWN",
                        message: "Failed to start recording. Please try again.",
                    });
                }
            }
        }
    }, [isReady]);

    const stopRecording = useCallback(() => {
        if (useNative.current && recognition.current) {
            recognition.current.stop();
            console.log("[APEX] [useWhisper] Stopped native speech recognition");
        } else if (mediaRecorder.current && mediaRecorder.current.state === "recording") {
            mediaRecorder.current.stop();
            console.log("[APEX] [useWhisper] Stopped Whisper recording");
        }
    }, []);

    return {
        isReady,
        isRecording,
        transcript,
        error,
        startRecording,
        stopRecording,
        clearError,
    };
}
