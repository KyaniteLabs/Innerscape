import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { ShutdownRitual } from "./ShutdownRitual";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// Mock fetch to return empty dynamic content
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("ShutdownRitual", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        // Set time to 6 PM (evening) so the ritual is visible
        vi.setSystemTime(new Date('2026-01-23T18:00:00'));
        
        // Clear localStorage to reset component state
        localStorage.clear();
        sessionStorage.clear();
        
        // Mock API responses to return no dynamic content
        mockFetch.mockImplementation((url: string) => {
            if (url.includes('/api/content/refresh')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ 
                        success: true, 
                        winddown: { techniques: [], isStale: false } 
                    }),
                });
            }
            if (url.includes('/api/tasks')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ 
                        success: true, 
                        items: [] 
                    }),
                });
            }
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ success: true }),
            });
        });
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.clearAllMocks();
    });

    it("renders shutdown steps", async () => {
        await act(async () => {
            render(<ShutdownRitual />);
        });
        // Find all buttons that contain the labels of our steps
        const step1 = screen.getByText("Close browser tabs").closest("button");
        const step2 = screen.getByText("Review open tasks").closest("button");
        const step3 = screen.getByText("Plan tomorrow").closest("button");
        const step4 = screen.getByText("Reset workspace").closest("button");
        
        expect(step1).toBeInTheDocument();
        expect(step2).toBeInTheDocument();
        expect(step3).toBeInTheDocument();
        expect(step4).toBeInTheDocument();
    });

    it("displays the section title and subtitle", async () => {
        await act(async () => {
            render(<ShutdownRitual />);
        });
        expect(screen.getByText("Wind Down")).toBeInTheDocument();
        expect(screen.getByText("End-of-day ritual")).toBeInTheDocument();
    });

    it("shows all 4 step labels", async () => {
        await act(async () => {
            render(<ShutdownRitual />);
        });
        expect(screen.getByText("Close browser tabs")).toBeInTheDocument();
        expect(screen.getByText("Review open tasks")).toBeInTheDocument();
        expect(screen.getByText("Plan tomorrow")).toBeInTheDocument();
        expect(screen.getByText("Reset workspace")).toBeInTheDocument();
    });

    it("shows progress counter starting at 0/4", async () => {
        await act(async () => {
            render(<ShutdownRitual />);
        });
        expect(screen.getByText(/0\/4/)).toBeInTheDocument();
    });

    it("updates progress when items are checked", async () => {
        await act(async () => {
            render(<ShutdownRitual />);
        });
        const step1 = screen.getByText("Close browser tabs").closest("button")!;
        const step2 = screen.getByText("Review open tasks").closest("button")!;
        
        // Click first item
        await act(async () => {
            fireEvent.click(step1);
        });
        
        // Should show 1/4
        expect(screen.getByText(/1\/4/)).toBeInTheDocument();
        
        // Click second item
        await act(async () => {
            fireEvent.click(step2);
        });
        expect(screen.getByText(/2\/4/)).toBeInTheDocument();
    });

    it("toggles items when clicked twice", async () => {
        await act(async () => {
            render(<ShutdownRitual />);
        });
        
        // Verify initial state shows 0/4
        expect(screen.getByText(/0\/4/)).toBeInTheDocument();
        
        const step1 = screen.getByText("Close browser tabs").closest("button")!;
        
        // Click to check
        await act(async () => {
            fireEvent.click(step1);
        });
        expect(screen.getByText(/1\/4/)).toBeInTheDocument();
        
        // Click to uncheck - verify back to 0/4
        await act(async () => {
            fireEvent.click(step1);
        });
        expect(screen.getByText(/0\/4/)).toBeInTheDocument();
    });

    it("shows completion message when all items checked", async () => {
        await act(async () => {
            render(<ShutdownRitual />);
        });
        
        const stepLabels = [
            "Close browser tabs",
            "Review open tasks",
            "Plan tomorrow",
            "Reset workspace"
        ];
        
        // Click each step button
        for (const label of stepLabels) {
            const btn = screen.getByText(label).closest("button")!;
            await act(async () => {
                fireEvent.click(btn);
            });
        }
        
        // Should show 4/4 and completion message
        expect(screen.getByText(/4\/4/)).toBeInTheDocument();
        expect(screen.getByText(/All done! Rest well/)).toBeInTheDocument();
    });

    it("does NOT show completion message initially", async () => {
        await act(async () => {
            render(<ShutdownRitual />);
        });
        expect(screen.queryByText(/All done! Rest well/)).not.toBeInTheDocument();
    });
});
