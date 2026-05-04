/**
 * Skeleton Component Tests
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { 
    Skeleton, 
    CardSkeleton, 
    ProjectGridSkeleton, 
    ListSkeleton, 
    StatsSkeleton 
} from "./Skeleton";

describe("Skeleton", () => {
    it("renders with default styling", () => {
        const { container } = render(<Skeleton />);
        
        const skeleton = container.firstChild;
        expect(skeleton).toHaveClass("animate-pulse");
    });

    it("accepts custom className", () => {
        const { container } = render(<Skeleton className="custom-class" />);
        
        const skeleton = container.firstChild;
        expect(skeleton).toHaveClass("custom-class");
    });

    it("accepts custom style", () => {
        const { container } = render(
            <Skeleton style={{ width: "200px", height: "50px" }} />
        );
        
        const skeleton = container.firstChild as HTMLElement;
        expect(skeleton.style.width).toBe("200px");
        expect(skeleton.style.height).toBe("50px");
    });
});

describe("CardSkeleton", () => {
    it("renders a card skeleton", () => {
        const { container } = render(<CardSkeleton />);
        
        const card = container.firstChild;
        expect(card).toHaveClass("card");
    });

    it("contains multiple skeleton elements", () => {
        const { container } = render(<CardSkeleton />);
        
        const skeletons = container.querySelectorAll(".animate-pulse");
        expect(skeletons.length).toBeGreaterThan(0);
    });
});

describe("ProjectGridSkeleton", () => {
    it("renders default 4 cards", () => {
        const { container } = render(<ProjectGridSkeleton />);
        
        const cards = container.querySelectorAll(".card");
        expect(cards).toHaveLength(4);
    });

    it("renders specified number of cards", () => {
        const { container } = render(<ProjectGridSkeleton count={6} />);
        
        const cards = container.querySelectorAll(".card");
        expect(cards).toHaveLength(6);
    });

    it("has grid layout", () => {
        const { container } = render(<ProjectGridSkeleton />);
        
        expect(container.firstChild).toHaveClass("project-grid");
    });
});

describe("ListSkeleton", () => {
    it("renders default 5 items", () => {
        const { container } = render(<ListSkeleton />);
        
        const cards = container.querySelectorAll(".card");
        expect(cards).toHaveLength(5);
    });

    it("renders specified number of items", () => {
        const { container } = render(<ListSkeleton count={3} />);
        
        const cards = container.querySelectorAll(".card");
        expect(cards).toHaveLength(3);
    });
});

describe("StatsSkeleton", () => {
    it("renders 3 stat cards", () => {
        const { container } = render(<StatsSkeleton />);
        
        const cards = container.querySelectorAll(".card");
        expect(cards).toHaveLength(3);
    });

    it("has flex layout", () => {
        const { container } = render(<StatsSkeleton />);
        
        expect(container.firstChild).toHaveClass("flex");
    });
});
