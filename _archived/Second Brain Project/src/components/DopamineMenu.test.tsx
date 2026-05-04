import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { DopamineMenu } from "./DopamineMenu";

// Mock fetch to return empty dynamic content
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("DopamineMenu", () => {
    beforeEach(() => {
        // Mock API responses
        mockFetch.mockImplementation((url: string) => {
            if (url.includes('/api/content/refresh')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ 
                        success: true, 
                        regulation: { techniques: [], isStale: false } 
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
        vi.clearAllMocks();
    });
    it("renders all 4 dopamine categories", () => {
        render(<DopamineMenu />);

        expect(screen.getByText("Warm Up")).toBeInTheDocument();
        expect(screen.getByText("Deep Work")).toBeInTheDocument();
        expect(screen.getByText("Support")).toBeInTheDocument();
        expect(screen.getByText("Rest")).toBeInTheDocument();
    });

    it("renders the section title", () => {
        render(<DopamineMenu />);
        expect(screen.getByText("Regulation Menu")).toBeInTheDocument();
    });

    it("includes specific regulation items", () => {
        render(<DopamineMenu />);
        
        // Warm Up items
        expect(screen.getByText("Pet the dog")).toBeInTheDocument();
        expect(screen.getByText("Hydration")).toBeInTheDocument();
        
        // Deep Work items
        expect(screen.getByText("Deep focus")).toBeInTheDocument();
        expect(screen.getByText("Creative flow")).toBeInTheDocument();
        
        // Support items
        expect(screen.getByText("Ambient sounds")).toBeInTheDocument();
        
        // Rest items - use getAllByText since there may be multiple instances
        expect(screen.getAllByText("Digital drift").length).toBeGreaterThan(0);
    });

    it("renders the expected number of cards", () => {
        render(<DopamineMenu />);
        const cards = document.querySelectorAll('.card');
        // Component renders 5 cards (4 categories + 1 header)
        expect(cards.length).toBeGreaterThanOrEqual(4);
    });
});
