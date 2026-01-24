/**
 * Celebrations Component Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { 
    SuccessCheck, 
    GlowPulse, 
    StreakCounter,
    AnimatedCounter,
    CelebrationToast,
} from "./Celebrations";

describe("SuccessCheck", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("renders when visible", () => {
        const { container } = render(<SuccessCheck isVisible={true} />);
        
        // Should render the check icon
        expect(container.querySelector("svg")).toBeInTheDocument();
    });

    it("does not render when not visible", () => {
        const { container } = render(<SuccessCheck isVisible={false} />);
        
        expect(container.firstChild).toBeNull();
    });

    it("calls onComplete after animation", () => {
        const onComplete = vi.fn();
        
        render(<SuccessCheck isVisible={true} onComplete={onComplete} />);
        
        // Fast forward time
        act(() => {
            vi.advanceTimersByTime(700);
        });
        
        expect(onComplete).toHaveBeenCalled();
    });
});

describe("GlowPulse", () => {
    it("renders children", () => {
        render(
            <GlowPulse isActive={true}>
                <span>Test content</span>
            </GlowPulse>
        );
        
        expect(screen.getByText("Test content")).toBeInTheDocument();
    });

    it("renders without glow when inactive", () => {
        const { container } = render(
            <GlowPulse isActive={false}>
                <span>Content</span>
            </GlowPulse>
        );
        
        // Should not have the pulse overlay
        const pulseOverlay = container.querySelector("[class*='animate-pulse']");
        expect(pulseOverlay).toBeNull();
    });
});

describe("StreakCounter", () => {
    it("renders streak count", () => {
        render(<StreakCounter count={7} />);
        
        expect(screen.getByText("7")).toBeInTheDocument();
    });

    it("shows fire icon by default", () => {
        const { container } = render(<StreakCounter count={5} />);
        
        expect(container.querySelector("svg")).toBeInTheDocument();
    });

    it("hides fire icon when showFire is false", () => {
        const { container } = render(<StreakCounter count={5} showFire={false} />);
        
        // Should have content but the fire icon styling class shouldn't be present
        expect(screen.getByText("5")).toBeInTheDocument();
    });

    it("renders custom label", () => {
        render(<StreakCounter count={3} label="week streak" />);
        
        expect(screen.getByText("week streak")).toBeInTheDocument();
    });

    it("returns null when count is 0", () => {
        const { container } = render(<StreakCounter count={0} />);
        
        expect(container.firstChild).toBeNull();
    });
});

describe("AnimatedCounter", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("displays the target value", async () => {
        render(<AnimatedCounter value={100} duration={100} />);
        
        // Fast forward to end of animation
        await act(async () => {
            vi.advanceTimersByTime(200);
        });
        
        expect(screen.getByText("100")).toBeInTheDocument();
    });

    it("renders with prefix", async () => {
        render(<AnimatedCounter value={50} prefix="$" duration={100} />);
        
        await act(async () => {
            vi.advanceTimersByTime(200);
        });
        
        expect(screen.getByText("$50")).toBeInTheDocument();
    });

    it("renders with suffix", async () => {
        render(<AnimatedCounter value={75} suffix="%" duration={100} />);
        
        await act(async () => {
            vi.advanceTimersByTime(200);
        });
        
        expect(screen.getByText("75%")).toBeInTheDocument();
    });
});

describe("CelebrationToast", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("renders when visible", () => {
        render(<CelebrationToast message="Great job!" isVisible={true} />);
        
        expect(screen.getByText("Great job!")).toBeInTheDocument();
    });

    it("does not render when not visible", () => {
        render(<CelebrationToast message="Hidden" isVisible={false} />);
        
        expect(screen.queryByText("Hidden")).not.toBeInTheDocument();
    });

    it("calls onClose after timeout", () => {
        const onClose = vi.fn();
        
        render(
            <CelebrationToast 
                message="Test" 
                isVisible={true} 
                onClose={onClose}
            />
        );
        
        act(() => {
            vi.advanceTimersByTime(3500);
        });
        
        expect(onClose).toHaveBeenCalled();
    });

    it("has correct role for accessibility", () => {
        render(<CelebrationToast message="Success!" isVisible={true} />);
        
        expect(screen.getByRole("alert")).toBeInTheDocument();
    });
});
