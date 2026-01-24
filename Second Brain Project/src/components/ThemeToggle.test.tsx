/**
 * ThemeToggle Component Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeToggle, ThemeSelector } from "./ThemeToggle";

// Mock the useTheme hook
const mockToggleTheme = vi.fn();
const mockSetTheme = vi.fn();
let mockTheme = "system";
let mockResolvedTheme = "dark";
let mockMounted = true;

vi.mock("@/lib/hooks/useTheme", () => ({
    useTheme: () => ({
        theme: mockTheme,
        resolvedTheme: mockResolvedTheme,
        toggleTheme: mockToggleTheme,
        setTheme: mockSetTheme,
        mounted: mockMounted,
    }),
}));

describe("ThemeToggle", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockTheme = "system";
        mockResolvedTheme = "dark";
        mockMounted = true;
    });

    it("renders nothing meaningful before mount", () => {
        mockMounted = false;
        
        const { container } = render(<ThemeToggle />);
        
        // Should still render a button for layout consistency, but empty icon area
        const button = container.querySelector("button");
        expect(button).toBeInTheDocument();
    });

    it("renders sun icon in dark mode", () => {
        mockResolvedTheme = "dark";
        
        const { container } = render(<ThemeToggle />);
        
        // Sun icon appears in dark mode (to switch to light)
        expect(container.querySelector("svg")).toBeInTheDocument();
    });

    it("renders moon icon in light mode", () => {
        mockResolvedTheme = "light";
        
        const { container } = render(<ThemeToggle />);
        
        // Moon icon appears in light mode (to switch to dark)
        expect(container.querySelector("svg")).toBeInTheDocument();
    });

    it("calls toggleTheme on click", () => {
        render(<ThemeToggle />);
        
        const button = screen.getByRole("button");
        fireEvent.click(button);
        
        expect(mockToggleTheme).toHaveBeenCalledTimes(1);
    });

    it("has appropriate title", () => {
        mockResolvedTheme = "dark";
        
        render(<ThemeToggle />);
        
        const button = screen.getByRole("button");
        expect(button).toHaveAttribute("title", "Switch to light mode");
    });
});

describe("ThemeSelector", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockTheme = "system";
        mockMounted = true;
    });

    it("renders nothing before mount", () => {
        mockMounted = false;
        
        const { container } = render(<ThemeSelector />);
        
        expect(container.firstChild).toBeNull();
    });

    it("renders three theme options", () => {
        render(<ThemeSelector />);
        
        const buttons = screen.getAllByRole("button");
        expect(buttons).toHaveLength(3);
    });

    it("highlights current theme", () => {
        mockTheme = "dark";
        
        render(<ThemeSelector />);
        
        const darkButton = screen.getByTitle("Dark mode");
        expect(darkButton).toHaveClass("btn-primary");
    });

    it("sets light theme on click", () => {
        render(<ThemeSelector />);
        
        const lightButton = screen.getByTitle("Light mode");
        fireEvent.click(lightButton);
        
        expect(mockSetTheme).toHaveBeenCalledWith("light");
    });

    it("sets dark theme on click", () => {
        render(<ThemeSelector />);
        
        const darkButton = screen.getByTitle("Dark mode");
        fireEvent.click(darkButton);
        
        expect(mockSetTheme).toHaveBeenCalledWith("dark");
    });

    it("sets system theme on click", () => {
        render(<ThemeSelector />);
        
        const systemButton = screen.getByTitle("System preference");
        fireEvent.click(systemButton);
        
        expect(mockSetTheme).toHaveBeenCalledWith("system");
    });
});
