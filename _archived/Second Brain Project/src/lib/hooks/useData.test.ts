/**
 * useData Hooks Tests
 * 
 * Tests for data fetching hooks.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import {
    useProjects,
    usePeople,
    useIdeas,
    useInbox,
    useStats,
    useCapture,
} from "./useData";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("useData Hooks", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.resetAllMocks();
    });

    describe("useProjects", () => {
        it("fetches and returns projects", async () => {
            const mockProjects = [
                { id: "1", name: "Project A", status: "active" },
                { id: "2", name: "Project B", status: "completed" },
            ];

            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: () => Promise.resolve({ success: true, items: mockProjects }),
            });

            const { result } = renderHook(() => useProjects());

            expect(result.current.isLoading).toBe(true);

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.projects).toEqual(mockProjects);
            expect(result.current.error).toBeNull();
        });

        it("filters by status when provided", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: () => Promise.resolve({ success: true, items: [] }),
            });

            renderHook(() => useProjects("active"));

            await waitFor(() => {
                expect(mockFetch).toHaveBeenCalledWith("/api/projects?status=active");
            });
        });

        it("handles fetch errors", async () => {
            mockFetch.mockRejectedValueOnce(new Error("Network error"));

            const { result } = renderHook(() => useProjects());

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.error).toBe("Network error");
            expect(result.current.projects).toEqual([]);
        });

        it("handles API error response", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: () => Promise.resolve({ success: false, error: "Unauthorized" }),
            });

            const { result } = renderHook(() => useProjects());

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.error).toBe("Unauthorized");
        });

        it("supports refetch", async () => {
            mockFetch
                .mockResolvedValueOnce({
                    ok: true,
                    status: 200,
                    json: () => Promise.resolve({ success: true, items: [{ id: "1" }] }),
                })
                .mockResolvedValueOnce({
                    ok: true,
                    status: 200,
                    json: () => Promise.resolve({ success: true, items: [{ id: "1" }, { id: "2" }] }),
                });

            const { result } = renderHook(() => useProjects());

            await waitFor(() => {
                expect(result.current.projects).toHaveLength(1);
            });

            await act(async () => {
                await result.current.refetch();
            });

            expect(result.current.projects).toHaveLength(2);
            expect(mockFetch).toHaveBeenCalledTimes(2);
        });
    });

    describe("usePeople", () => {
        it("fetches and returns people", async () => {
            const mockPeople = [{ id: "1", name: "John Doe" }];

            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: () => Promise.resolve({ success: true, items: mockPeople }),
            });

            const { result } = renderHook(() => usePeople());

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.people).toEqual(mockPeople);
            expect(mockFetch).toHaveBeenCalledWith("/api/people");
        });
    });

    describe("useIdeas", () => {
        it("fetches and returns ideas", async () => {
            const mockIdeas = [{ id: "1", name: "Great Idea" }];

            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: () => Promise.resolve({ success: true, items: mockIdeas }),
            });

            const { result } = renderHook(() => useIdeas());

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.ideas).toEqual(mockIdeas);
            expect(mockFetch).toHaveBeenCalledWith("/api/ideas");
        });
    });

    describe("useInbox", () => {
        it("fetches all inbox items without filter", async () => {
            const mockItems = [{ id: "1", originalText: "Test" }];

            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: () => Promise.resolve({ success: true, items: mockItems }),
            });

            const { result } = renderHook(() => useInbox());

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.items).toEqual(mockItems);
            expect(mockFetch).toHaveBeenCalledWith("/api/inbox");
        });

        it("filters by status when provided", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: () => Promise.resolve({ success: true, items: [] }),
            });

            renderHook(() => useInbox("pending"));

            await waitFor(() => {
                expect(mockFetch).toHaveBeenCalledWith("/api/inbox?status=pending");
            });
        });
    });

    describe("useStats", () => {
        it("fetches and returns stats", async () => {
            const mockStats = {
                projects: { total: 10, active: 5 },
                people: { total: 20 },
                ideas: { total: 15 },
                admin: { total: 5, pending: 2 },
                inbox: { pending: 3, needsReview: 1, totalCaptured: 100 },
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: () => Promise.resolve({ success: true, stats: mockStats }),
            });

            const { result } = renderHook(() => useStats());

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.stats).toEqual(mockStats);
        });

        it("handles error response", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: () => Promise.resolve({ success: false, error: "Stats unavailable" }),
            });

            const { result } = renderHook(() => useStats());

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.error).toBe("Stats unavailable");
            expect(result.current.stats).toBeNull();
        });
    });

    describe("useCapture", () => {
        it("starts with initial state", () => {
            const { result } = renderHook(() => useCapture());

            expect(result.current.isCapturing).toBe(false);
            expect(result.current.error).toBeNull();
            expect(result.current.lastCapture).toBeNull();
        });

        it("captures text successfully", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: () => Promise.resolve({
                    success: true,
                    id: "inbox-123",
                    destination: "projects",
                }),
            });

            const { result } = renderHook(() => useCapture());

            let captureResult;
            await act(async () => {
                captureResult = await result.current.capture("Test capture");
            });

            expect(captureResult).toMatchObject({
                success: true,
                id: "inbox-123",
                destination: "projects",
            });

            expect(result.current.lastCapture).toEqual({
                id: "inbox-123",
                destination: "projects",
            });
            expect(result.current.error).toBeNull();
        });

        it("sends correct request body", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: () => Promise.resolve({ success: true, id: "test" }),
            });

            const { result } = renderHook(() => useCapture());

            await act(async () => {
                await result.current.capture("Test text", "voice");
            });

            expect(mockFetch).toHaveBeenCalledWith("/api/capture", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: "Test text", source: "voice" }),
            });
        });

        it("handles capture error", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: () => Promise.resolve({
                    success: false,
                    error: "Rate limited",
                }),
            });

            const { result } = renderHook(() => useCapture());

            await act(async () => {
                try {
                    await result.current.capture("Test");
                } catch {
                    // Expected to throw
                }
            });

            expect(result.current.error).toBe("Rate limited");
            expect(result.current.lastCapture).toBeNull();
        });

        it("handles network error", async () => {
            mockFetch.mockRejectedValueOnce(new Error("Network failure"));

            const { result } = renderHook(() => useCapture());

            await act(async () => {
                try {
                    await result.current.capture("Test");
                } catch {
                    // Expected to throw
                }
            });

            expect(result.current.error).toBe("Network failure");
        });

        it("sets isCapturing during capture", async () => {
            let resolveCapture: (value: unknown) => void;
            mockFetch.mockReturnValueOnce(new Promise((resolve) => {
                resolveCapture = resolve;
            }));

            const { result } = renderHook(() => useCapture());

            let capturePromise: Promise<unknown>;
            act(() => {
                capturePromise = result.current.capture("Test");
            });

            expect(result.current.isCapturing).toBe(true);

            await act(async () => {
                resolveCapture!({
                    ok: true,
                    status: 200,
                    json: () => Promise.resolve({ success: true, id: "test" }),
                });
                await capturePromise;
            });

            expect(result.current.isCapturing).toBe(false);
        });

        it("clears error with clearError", async () => {
            mockFetch.mockRejectedValueOnce(new Error("Error"));

            const { result } = renderHook(() => useCapture());

            await act(async () => {
                try {
                    await result.current.capture("Test");
                } catch {
                    // Expected
                }
            });

            expect(result.current.error).toBe("Error");

            act(() => {
                result.current.clearError();
            });

            expect(result.current.error).toBeNull();
        });

        it("clears lastCapture with clearLastCapture", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: () => Promise.resolve({ success: true, id: "test-id" }),
            });

            const { result } = renderHook(() => useCapture());

            await act(async () => {
                await result.current.capture("Test");
            });

            expect(result.current.lastCapture).not.toBeNull();

            act(() => {
                result.current.clearLastCapture();
            });

            expect(result.current.lastCapture).toBeNull();
        });

        it("uses 'web' as default source", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: () => Promise.resolve({ success: true, id: "test" }),
            });

            const { result } = renderHook(() => useCapture());

            await act(async () => {
                await result.current.capture("Test");
            });

            const body = JSON.parse(mockFetch.mock.calls[0][1].body);
            expect(body.source).toBe("web");
        });
    });
});
