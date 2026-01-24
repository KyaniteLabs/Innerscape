"use client";

import { useState, useCallback, useEffect } from "react";
import { CONFIG } from "@/lib/config";

export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
    id: string;
    type: ToastType;
    message: string;
    duration?: number;
}

interface ToastState {
    toasts: Toast[];
    addToast: (type: ToastType, message: string, duration?: number) => void;
    removeToast: (id: string) => void;
    success: (message: string) => void;
    error: (message: string) => void;
    info: (message: string) => void;
    warning: (message: string) => void;
}

// Global toast state for cross-component access
let globalToasts: Toast[] = [];
const globalListeners: Set<() => void> = new Set();

function notifyListeners() {
    globalListeners.forEach(listener => listener());
}

export function useToast(): ToastState {
    const [, forceUpdate] = useState({});

    useEffect(() => {
        const listener = () => forceUpdate({});
        globalListeners.add(listener);
        return () => {
            globalListeners.delete(listener);
        };
    }, []);

    const addToast = useCallback((type: ToastType, message: string, duration = CONFIG.TOAST.DEFAULT_DURATION) => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const toast: Toast = { id, type, message, duration };
        
        globalToasts = [...globalToasts, toast];
        notifyListeners();

        // Auto-remove after duration
        if (duration > 0) {
            setTimeout(() => {
                globalToasts = globalToasts.filter(t => t.id !== id);
                notifyListeners();
            }, duration);
        }
    }, []);

    const removeToast = useCallback((id: string) => {
        globalToasts = globalToasts.filter(t => t.id !== id);
        notifyListeners();
    }, []);

    const success = useCallback((message: string) => addToast("success", message), [addToast]);
    const error = useCallback((message: string) => addToast("error", message), [addToast]);
    const info = useCallback((message: string) => addToast("info", message), [addToast]);
    const warning = useCallback((message: string) => addToast("warning", message), [addToast]);

    return {
        toasts: globalToasts,
        addToast,
        removeToast,
        success,
        error,
        info,
        warning,
    };
}
