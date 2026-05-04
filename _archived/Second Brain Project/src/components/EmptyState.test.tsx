/**
 * EmptyState Component Tests
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { 
    EmptyState, 
    EmptyInbox, 
    EmptyProjects, 
    EmptyIdeas, 
    EmptyPeople, 
    EmptyTasks 
} from "./EmptyState";
import { Folder } from "lucide-react";

describe("EmptyState", () => {
    it("renders title", () => {
        render(<EmptyState title="No items found" />);
        
        expect(screen.getByText("No items found")).toBeInTheDocument();
    });

    it("renders description when provided", () => {
        render(
            <EmptyState 
                title="No items" 
                description="Add your first item" 
            />
        );
        
        expect(screen.getByText("Add your first item")).toBeInTheDocument();
    });

    it("renders custom icon", () => {
        const { container } = render(
            <EmptyState 
                title="No folders" 
                icon={Folder} 
            />
        );
        
        // Icon should be rendered (Lucide icons render as SVG)
        expect(container.querySelector("svg")).toBeInTheDocument();
    });

    it("renders action button with onClick", () => {
        const handleClick = vi.fn();
        
        render(
            <EmptyState 
                title="No items" 
                action={{ label: "Add Item", onClick: handleClick }} 
            />
        );
        
        const button = screen.getByRole("button", { name: "Add Item" });
        expect(button).toBeInTheDocument();
        
        fireEvent.click(button);
        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("renders action link with href", () => {
        render(
            <EmptyState 
                title="No items" 
                action={{ label: "Go Home", href: "/" }} 
            />
        );
        
        const link = screen.getByRole("link", { name: "Go Home" });
        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute("href", "/");
    });

    it("does not render action when not provided", () => {
        render(<EmptyState title="No items" />);
        
        expect(screen.queryByRole("button")).not.toBeInTheDocument();
        expect(screen.queryByRole("link")).not.toBeInTheDocument();
    });
});

describe("EmptyInbox", () => {
    it("renders inbox empty state", () => {
        render(<EmptyInbox />);
        
        expect(screen.getByText("Inbox is empty")).toBeInTheDocument();
        expect(screen.getByText(/capture a thought/i)).toBeInTheDocument();
    });

    it("has link to dashboard", () => {
        render(<EmptyInbox />);
        
        const link = screen.getByRole("link");
        expect(link).toHaveAttribute("href", "/");
    });
});

describe("EmptyProjects", () => {
    it("renders projects empty state", () => {
        render(<EmptyProjects />);
        
        expect(screen.getByText("No projects yet")).toBeInTheDocument();
    });
});

describe("EmptyIdeas", () => {
    it("renders ideas empty state", () => {
        render(<EmptyIdeas />);
        
        expect(screen.getByText("No ideas captured")).toBeInTheDocument();
    });

    it("has link to capture", () => {
        render(<EmptyIdeas />);
        
        const link = screen.getByRole("link");
        expect(link).toHaveAttribute("href", "/");
    });
});

describe("EmptyPeople", () => {
    it("renders people empty state", () => {
        render(<EmptyPeople />);
        
        expect(screen.getByText("No people entries")).toBeInTheDocument();
    });
});

describe("EmptyTasks", () => {
    it("renders tasks empty state with positive message", () => {
        render(<EmptyTasks />);
        
        expect(screen.getByText("No pending tasks")).toBeInTheDocument();
        expect(screen.getByText(/all caught up/i)).toBeInTheDocument();
    });
});
