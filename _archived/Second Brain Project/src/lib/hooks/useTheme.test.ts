/**
 * useTheme Hook Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useTheme } from "./useTheme";

// Mock matchMedia
const mockMatchMedia = vi.fn();
const mockMediaQueryList = {
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
};

// Mock localStorage
const localStorageMock = {
    store: {} as Record<string, string>,
    getItem: vi.fn((key: string) => localStorageMock.store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
        localStorageMock.store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
        delete localStorageMock.store[key];
    }),
    clear: vi.fn(() => {
        localStorageMock.store = {};
    }),
};

describe("useTheme", () => {
    beforeEach(() => {
        // Reset mocks
        localStorageMock.clear();
        mockMediaQueryList.matches = false;
        mockMatchMedia.mockReturnValue(mockMediaQueryList);

        // Apply mocks
        Object.defineProperty(window, "localStorage", { value: localStorageMock });
        Object.defineProperty(window, "matchMedia", { value: mockMatchMedia });

        // Mock document.documentElement.setAttribute
        vi.spyOn(document.documentElement, "setAttribute").mockImplementation(() => {});
    });

    afterEach(() => {
        vi.resetAllMocks();
    });

    describe("initial state", () => {
        it("initializes with system theme by default", async () => {
            const { result } = renderHook(() => useTheme());

            await waitFor(() => {
                expect(result.current.mounted).toBe(true);
            });

            expect(result.current.theme).toBe("system");
        });

        it("loads stored theme from localStorage", async () => {
            localStorageMock.setItem("neurosecond-theme", "dark");

            const { result } = renderHook(() => useTheme());

            await waitFor(() => {
                expect(result.current.mounted).toBe(true);
            });

            expect(result.current.theme).toBe("dark");
        });

        it("ignores invalid stored theme values", async () => {
            localStorageMock.setItem("neurosecond-theme", "invalid");

            const { result } = renderHook(() => useTheme());

            await waitFor(() => {
                expect(result.current.mounted).toBe(true);
            });

            expect(result.current.theme).toBe("system");
        });
    });

    describe("resolved theme", () => {
        it("resolves dark when theme is dark", async () => {
            localStorageMock.setItem("neurosecond-theme", "dark");

            const { result } = renderHook(() => useTheme());

            await waitFor(() => {
                expect(result.current.mounted).toBe(true);
            });

            expect(result.current.resolvedTheme).toBe("dark");
        });

        it("resolves light when theme is light", async () => {
            localStorageMock.setItem("neurosecond-theme", "light");

            const { result } = renderHook(() => useTheme());

            await waitFor(() => {
                expect(result.current.mounted).toBe(true);
            });

            expect(result.current.resolvedTheme).toBe("light");
        });

        it("resolves to system preference when theme is system", async () => {
            mockMediaQueryList.matches = true; // Prefer dark

            const { result } = renderHook(() => useTheme());

            await waitFor(() => {
                expect(result.current.mounted).toBe(true);
            });

            expect(result.current.theme).toBe("system");
            expect(result.current.resolvedTheme).toBe("dark");
        });

        it("resolves to light when system prefers light", async () => {
            mockMediaQueryList.matches = false; // Prefer light

            const { result } = renderHook(() => useTheme());

            await waitFor(() => {
                expect(result.current.mounted).toBe(true);
            });

            expect(result.current.theme).toBe("system");
            expect(result.current.resolvedTheme).toBe("light");
        });
    });

    describe("setTheme", () => {
        it("updates theme state", async () => {
            const { result } = renderHook(() => useTheme());

            await waitFor(() => {
                expect(result.current.mounted).toBe(true);
            });

            act(() => {
                result.current.setTheme("dark");
            });

            expect(result.current.theme).toBe("dark");
        });

        it("persists theme to localStorage", async () => {
            const { result } = renderHook(() => useTheme());

            await waitFor(() => {
                expect(result.current.mounted).toBe(true);
            });

            act(() => {
                result.current.setTheme("light");
            });

            expect(localStorageMock.setItem).toHaveBeenCalledWith("neurosecond-theme", "light");
        });

        it("updates document attribute", async () => {
            const { result } = renderHook(() => useTheme());

            await waitFor(() => {
                expect(result.current.mounted).toBe(true);
            });

            act(() => {
                result.current.setTheme("dark");
            });

            expect(document.documentElement.setAttribute).toHaveBeenCalledWith("data-theme", "dark");
        });
    });

    describe("toggleTheme", () => {
        it("toggles from dark to light", async () => {
            localStorageMock.setItem("neurosecond-theme", "dark");

            const { result } = renderHook(() => useTheme());

            await waitFor(() => {
                expect(result.current.mounted).toBe(true);
            });

            expect(result.current.resolvedTheme).toBe("dark");

            act(() => {
                result.current.toggleTheme();
            });

            expect(result.current.theme).toBe("light");
            expect(result.current.resolvedTheme).toBe("light");
        });

        it("toggles from light to dark", async () => {
            localStorageMock.setItem("neurosecond-theme", "light");

            const { result } = renderHook(() => useTheme());

            await waitFor(() => {
                expect(result.current.mounted).toBe(true);
            });

            expect(result.current.resolvedTheme).toBe("light");

            act(() => {
                result.current.toggleTheme();
            });

            expect(result.current.theme).toBe("dark");
            expect(result.current.resolvedTheme).toBe("dark");
        });

        it("toggles from system to opposite of resolved", async () => {
            mockMediaQueryList.matches = true; // System prefers dark

            const { result } = renderHook(() => useTheme());

            await waitFor(() => {
                expect(result.current.mounted).toBe(true);
            });

            expect(result.current.theme).toBe("system");
            expect(result.current.resolvedTheme).toBe("dark");

            act(() => {
                result.current.toggleTheme();
            });

            // Should toggle to light (opposite of resolved dark)
            expect(result.current.theme).toBe("light");
        });
    });

    describe("mounted state", () => {
        it("becomes mounted after effect runs", async () => {
            const { result } = renderHook(() => useTheme());

            // In test environment, effects run synchronously
            await waitFor(() => {
                expect(result.current.mounted).toBe(true);
            });
        });

        it("mounted is a boolean value", async () => {
            const { result } = renderHook(() => useTheme());

            await waitFor(() => {
                expect(typeof result.current.mounted).toBe("boolean");
            });
        });
    });

    describe("system theme listener", () => {
        it("registers listener when theme is system", async () => {
            const { result } = renderHook(() => useTheme());

            await waitFor(() => {
                expect(result.current.mounted).toBe(true);
            });

            expect(mockMediaQueryList.addEventListener).toHaveBeenCalledWith(
                "change",
                expect.any(Function)
            );
        });

        it("removes listener on unmount", async () => {
            const { result, unmount } = renderHook(() => useTheme());

            await waitFor(() => {
                expect(result.current.mounted).toBe(true);
            });

            unmount();

            expect(mockMediaQueryList.removeEventListener).toHaveBeenCalledWith(
                "change",
                expect.any(Function)
            );
        });
    });
});
