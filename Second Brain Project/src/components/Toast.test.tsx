/**
 * Toast Component Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ToastContainer } from "./Toast";

// Mock the useToast hook
const mockRemoveToast = vi.fn();
let mockToasts: Array<{ id: string; type: "success" | "error" | "info" | "warning"; message: string }> = [];

vi.mock("@/lib/hooks/useToast", () => ({
    useToast: () => ({
        toasts: mockToasts,
        removeToast: mockRemoveToast,
    }),
}));

describe("ToastContainer", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockToasts = [];
    });

    it("renders nothing when no toasts", () => {
        const { container } = render(<ToastContainer />);
        
        expect(container.firstChild).toBeNull();
    });

    it("renders success toast", () => {
        mockToasts = [{ id: "1", type: "success", message: "Operation successful!" }];
        
        render(<ToastContainer />);
        
        expect(screen.getByText("Operation successful!")).toBeInTheDocument();
    });

    it("renders error toast", () => {
        mockToasts = [{ id: "1", type: "error", message: "Something went wrong" }];
        
        render(<ToastContainer />);
        
        expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    });

    it("renders info toast", () => {
        mockToasts = [{ id: "1", type: "info", message: "Did you know?" }];
        
        render(<ToastContainer />);
        
        expect(screen.getByText("Did you know?")).toBeInTheDocument();
    });

    it("renders warning toast", () => {
        mockToasts = [{ id: "1", type: "warning", message: "Be careful!" }];
        
        render(<ToastContainer />);
        
        expect(screen.getByText("Be careful!")).toBeInTheDocument();
    });

    it("renders multiple toasts", () => {
        mockToasts = [
            { id: "1", type: "success", message: "First toast" },
            { id: "2", type: "error", message: "Second toast" },
            { id: "3", type: "info", message: "Third toast" },
        ];
        
        render(<ToastContainer />);
        
        expect(screen.getByText("First toast")).toBeInTheDocument();
        expect(screen.getByText("Second toast")).toBeInTheDocument();
        expect(screen.getByText("Third toast")).toBeInTheDocument();
    });

    it("calls removeToast when close button clicked", () => {
        mockToasts = [{ id: "toast-1", type: "success", message: "Test message" }];
        
        render(<ToastContainer />);
        
        const closeButton = screen.getByRole("button");
        fireEvent.click(closeButton);
        
        expect(mockRemoveToast).toHaveBeenCalledWith("toast-1");
    });

    it("has fixed positioning", () => {
        mockToasts = [{ id: "1", type: "info", message: "Test" }];
        
        const { container } = render(<ToastContainer />);
        
        const toastContainer = container.firstChild as HTMLElement;
        expect(toastContainer.style.position).toBe("fixed");
    });
});
