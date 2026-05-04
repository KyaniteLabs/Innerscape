"use client";

import { useState, useEffect, useCallback } from "react";

// ===== TYPES =====

export interface Project {
    id: string;
    name: string;
    status: "active" | "waiting" | "blocked" | "someday" | "completed";
    nextAction: string | null;
    notes: string | null;
    tags: string[];
    lastTouched: string | null;
}

export interface Person {
    id: string;
    name: string;
    context: string | null;
    followUps: string | null;
    tags: string[];
    lastTouched: string | null;
}

export interface Idea {
    id: string;
    name: string;
    oneLiner: string | null;
    notes: string | null;
    tags: string[];
    lastTouched: string | null;
}

export interface InboxItem {
    id: string;
    originalText: string;
    filedTo: string | null;
    destinationId: string | null;
    confidence: number | null;
    status: "pending" | "filed" | "needs_review" | "fixed";
    captureSource: string | null;
    createdAt: string | null;
}

export interface Stats {
    projects: { total: number; active: number };
    people: { total: number };
    ideas: { total: number };
    admin: { total: number; pending: number };
    inbox: { pending: number; needsReview: number; totalCaptured: number };
}

export interface UnifiedItem {
    id: string;
    type: "projects" | "people" | "ideas" | "admin";
    name: string;
    content: string;
    metadata: Record<string, any>;
    temporal: {
        createdAt: string;
        lastTouched: string;
        dueDate: string | null;
        archivedAt: string | null;
    };
    tags: string[];
    userId: string;
}

// ===== GENERIC FETCH HOOK =====

interface UseFetchResult<T> {
    data: T | null;
    isLoading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

function useFetch<T>(url: string, initialData: T | null = null): UseFetchResult<T> {
    const [data, setData] = useState<T | null>(initialData);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch(url);
            
            // Check HTTP status first
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}: ${res.statusText || "Request failed"}`);
            }
            
            const json = await res.json();

            if (!json.success) {
                throw new Error(json.error || "Failed to fetch");
            }

            setData(json.items ?? json.stats ?? json);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error");
        } finally {
            setIsLoading(false);
        }
    }, [url]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { data, isLoading, error, refetch: fetchData };
}

// ===== SPECIFIC HOOKS =====

export function useProjects(status?: string) {
    const url = status ? `/api/projects?status=${status}` : "/api/projects";
    const result = useFetch<Project[]>(url, []);
    return {
        projects: result.data ?? [],
        isLoading: result.isLoading,
        error: result.error,
        refetch: result.refetch,
    };
}

export function usePeople() {
    const result = useFetch<Person[]>("/api/people", []);
    return {
        people: result.data ?? [],
        isLoading: result.isLoading,
        error: result.error,
        refetch: result.refetch,
    };
}

export function useIdeas() {
    const result = useFetch<Idea[]>("/api/ideas", []);
    return {
        ideas: result.data ?? [],
        isLoading: result.isLoading,
        error: result.error,
        refetch: result.refetch,
    };
}

export function useInbox(status?: string) {
    const url = status ? `/api/inbox?status=${status}` : "/api/inbox";
    const result = useFetch<InboxItem[]>(url, []);
    return {
        items: result.data ?? [],
        isLoading: result.isLoading,
        error: result.error,
        refetch: result.refetch,
    };
}

export function useUnifiedStream(options: { 
    type?: string; 
    sortBy?: string; 
    includeArchived?: boolean;
    limit?: number;
} = {}) {
    const { type, sortBy = "lastTouched", includeArchived = false, limit = 50 } = options;
    const params = new URLSearchParams();
    if (type) params.append("type", type);
    params.append("sortBy", sortBy);
    if (includeArchived) params.append("includeArchived", "true");
    params.append("limit", limit.toString());

    const url = `/api/unified?${params.toString()}`;
    const result = useFetch<UnifiedItem[]>(url, []);
    
    return {
        items: result.data ?? [],
        isLoading: result.isLoading,
        error: result.error,
        refetch: result.refetch,
    };
}

export function useStats() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStats = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch("/api/stats");
            const json = await res.json();

            if (!json.success) {
                throw new Error(json.error || "Failed to fetch stats");
            }

            setStats(json.stats);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    return { stats, isLoading, error, refetch: fetchStats };
}

// ===== MUTATION HOOKS =====

export function useCapture() {
    const [isCapturing, setIsCapturing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastCapture, setLastCapture] = useState<{
        id: string;
        destination?: string;
    } | null>(null);

    const capture = useCallback(async (text: string, source = "web") => {
        setIsCapturing(true);
        setError(null);

        try {
            const res = await fetch("/api/capture", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text, source }),
            });

            const json = await res.json();

            if (!json.success) {
                throw new Error(json.message || json.error || "Capture failed");
            }

            setLastCapture({
                id: json.id,
                destination: json.destination,
            });

            return json;
        } catch (err) {
            const message = err instanceof Error ? err.message : "Capture failed";
            setError(message);
            throw err;
        } finally {
            setIsCapturing(false);
        }
    }, []);

    const clearError = useCallback(() => setError(null), []);
    const clearLastCapture = useCallback(() => setLastCapture(null), []);

    return {
        capture,
        isCapturing,
        error,
        lastCapture,
        clearError,
        clearLastCapture,
    };
}
