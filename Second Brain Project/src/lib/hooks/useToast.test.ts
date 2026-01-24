/**
 * useToast Hook Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

// Mock config
vi.mock("@/lib/config", () => ({
    CONFIG: {
        TOAST: {
            DEFAULT_DURATION: 100, // Short duration for tests
        },
        HTTP: {
            BAD_REQUEST: 400,
            NOT_FOUND: 404,
            INTERNAL_SERVER_ERROR: 500,
        },
    },
}));

describe("useToast", () => {
    // Reset module to clear global toast state before each test
    beforeEach(async () => {
        vi.resetModules();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    // Helper to import fresh hook
    async function getUseToast() {
        const module = await import("./useToast");
        return module.useToast;
    }

    describe("initial state", () => {
        it("starts with empty toasts array", async () => {
            const useToast = await getUseToast();
            const { result } = renderHook(() => useToast());
            expect(result.current.toasts).toEqual([]);
        });

        it("provides all helper methods", async () => {
            const useToast = await getUseToast();
            const { result } = renderHook(() => useToast());
            
            expect(typeof result.current.addToast).toBe("function");
            expect(typeof result.current.removeToast).toBe("function");
            expect(typeof result.current.success).toBe("function");
            expect(typeof result.current.error).toBe("function");
            expect(typeof result.current.info).toBe("function");
            expect(typeof result.current.warning).toBe("function");
        });
    });

    describe("addToast", () => {
        it("adds a toast with correct properties", async () => {
            const useToast = await getUseToast();
            const { result } = renderHook(() => useToast());

            act(() => {
                result.current.addToast("success", "Test message");
            });

            expect(result.current.toasts).toHaveLength(1);
            expect(result.current.toasts[0]).toMatchObject({
                type: "success",
                message: "Test message",
            });
            expect(result.current.toasts[0].id).toMatch(/^toast-/);
        });

        it("supports all toast types", async () => {
            const useToast = await getUseToast();
            const { result } = renderHook(() => useToast());
            const types: Array<"success" | "error" | "info" | "warning"> = ["success", "error", "info", "warning"];

            types.forEach((type, index) => {
                act(() => {
                    result.current.addToast(type, `${type} message`);
                });

                expect(result.current.toasts[index].type).toBe(type);
            });
        });

        it("auto-removes toast after duration", async () => {
            vi.useRealTimers(); // Use real timers for this test
            
            const useToast = await getUseToast();
            const { result } = renderHook(() => useToast());

            act(() => {
                result.current.addToast("info", "Auto-remove test", 50); // Very short duration
            });

            expect(result.current.toasts).toHaveLength(1);

            // Wait for the toast to be auto-removed
            await waitFor(() => {
                expect(result.current.toasts).toHaveLength(0);
            }, { timeout: 200 });
        });

        it("allows multiple toasts simultaneously", async () => {
            const useToast = await getUseToast();
            const { result } = renderHook(() => useToast());

            act(() => {
                result.current.addToast("success", "Message 1");
                result.current.addToast("error", "Message 2");
                result.current.addToast("info", "Message 3");
            });

            expect(result.current.toasts).toHaveLength(3);
        });
    });

    describe("removeToast", () => {
        it("removes specific toast by id", async () => {
            const useToast = await getUseToast();
            const { result } = renderHook(() => useToast());

            act(() => {
                result.current.addToast("info", "Toast 1");
                result.current.addToast("info", "Toast 2");
            });

            const toastId = result.current.toasts[0].id;

            act(() => {
                result.current.removeToast(toastId);
            });

            expect(result.current.toasts).toHaveLength(1);
            expect(result.current.toasts[0].message).toBe("Toast 2");
        });

        it("handles removing non-existent toast gracefully", async () => {
            const useToast = await getUseToast();
            const { result } = renderHook(() => useToast());

            act(() => {
                result.current.addToast("info", "Test");
            });

            act(() => {
                result.current.removeToast("non-existent-id");
            });

            expect(result.current.toasts).toHaveLength(1);
        });
    });

    describe("helper methods", () => {
        it("success() creates success toast", async () => {
            const useToast = await getUseToast();
            const { result } = renderHook(() => useToast());

            act(() => {
                result.current.success("Success message");
            });

            expect(result.current.toasts[0]).toMatchObject({
                type: "success",
                message: "Success message",
            });
        });

        it("error() creates error toast", async () => {
            const useToast = await getUseToast();
            const { result } = renderHook(() => useToast());

            act(() => {
                result.current.error("Error message");
            });

            expect(result.current.toasts[0]).toMatchObject({
                type: "error",
                message: "Error message",
            });
        });

        it("info() creates info toast", async () => {
            const useToast = await getUseToast();
            const { result } = renderHook(() => useToast());

            act(() => {
                result.current.info("Info message");
            });

            expect(result.current.toasts[0]).toMatchObject({
                type: "info",
                message: "Info message",
            });
        });

        it("warning() creates warning toast", async () => {
            const useToast = await getUseToast();
            const { result } = renderHook(() => useToast());

            act(() => {
                result.current.warning("Warning message");
            });

            expect(result.current.toasts[0]).toMatchObject({
                type: "warning",
                message: "Warning message",
            });
        });
    });

    describe("global state", () => {
        it("syncs toasts across multiple hook instances", async () => {
            const useToast = await getUseToast();
            const { result: result1 } = renderHook(() => useToast());
            const { result: result2 } = renderHook(() => useToast());

            act(() => {
                result1.current.addToast("success", "Shared toast");
            });

            // Both instances should see the same toast
            expect(result1.current.toasts).toHaveLength(1);
            expect(result2.current.toasts).toHaveLength(1);
            expect(result1.current.toasts[0].id).toBe(result2.current.toasts[0].id);
        });
    });
});
