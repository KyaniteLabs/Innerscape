/**
 * Progress Component Tests
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { 
    CompletionRing, 
    StatCard, 
    StreakDisplay,
    WeeklyActivity,
    ActivityIndicator,
    CompactStats,
} from "./Progress";
import { Target } from "lucide-react";

describe("CompletionRing", () => {
    it("renders with progress percentage", () => {
        render(<CompletionRing progress={75} />);
        
        expect(screen.getByText("75%")).toBeInTheDocument();
    });

    it("displays progress even above 100%", () => {
        render(<CompletionRing progress={150} />);
        
        // The ring visual caps at 100%, but the number shows the actual value
        expect(screen.getByText("150%")).toBeInTheDocument();
    });

    it("renders with custom label", () => {
        render(<CompletionRing progress={50} label="Done" />);
        
        expect(screen.getByText("Done")).toBeInTheDocument();
    });

    it("hides percentage when showPercentage is false", () => {
        render(<CompletionRing progress={50} showPercentage={false} />);
        
        expect(screen.queryByText("50%")).not.toBeInTheDocument();
    });

    it("renders with custom icon", () => {
        const { container } = render(
            <CompletionRing progress={50} icon={<Target data-testid="icon" />} />
        );
        
        expect(screen.getByTestId("icon")).toBeInTheDocument();
    });
});

describe("StatCard", () => {
    it("renders label and value", () => {
        render(<StatCard label="Captures" value={42} />);
        
        expect(screen.getByText("Captures")).toBeInTheDocument();
        expect(screen.getByText("42")).toBeInTheDocument();
    });

    it("renders string values", () => {
        render(<StatCard label="Status" value="Active" />);
        
        expect(screen.getByText("Active")).toBeInTheDocument();
    });

    it("shows positive trend", () => {
        render(<StatCard label="Test" value={10} trend={15} />);
        
        expect(screen.getByText("+15%")).toBeInTheDocument();
    });

    it("shows negative trend", () => {
        render(<StatCard label="Test" value={10} trend={-10} />);
        
        expect(screen.getByText("-10%")).toBeInTheDocument();
    });

    it("shows trend label", () => {
        render(<StatCard label="Test" value={10} trend={5} trendLabel="vs last week" />);
        
        expect(screen.getByText("vs last week")).toBeInTheDocument();
    });

    it("formats large numbers with locale", () => {
        render(<StatCard label="Total" value={1234567} />);
        
        expect(screen.getByText("1,234,567")).toBeInTheDocument();
    });
});

describe("StreakDisplay", () => {
    it("renders current streak", () => {
        render(<StreakDisplay currentStreak={7} longestStreak={14} />);
        
        expect(screen.getByText("7")).toBeInTheDocument();
        expect(screen.getByText(/day streak/)).toBeInTheDocument();
    });

    it("shows longest streak", () => {
        render(<StreakDisplay currentStreak={5} longestStreak={10} />);
        
        expect(screen.getByText(/Best: 10 days/)).toBeInTheDocument();
    });

    it("shows today complete message", () => {
        render(<StreakDisplay currentStreak={3} longestStreak={5} todayComplete={true} />);
        
        expect(screen.getByText("Today complete!")).toBeInTheDocument();
    });

    it("shows encouragement when today not complete", () => {
        render(<StreakDisplay currentStreak={3} longestStreak={5} todayComplete={false} />);
        
        expect(screen.getByText(/Capture something today/)).toBeInTheDocument();
    });
});

describe("WeeklyActivity", () => {
    it("renders bars for each day", () => {
        const data = [
            { day: "Mon", count: 5 },
            { day: "Tue", count: 3 },
            { day: "Wed", count: 7 },
        ];
        
        const { container } = render(<WeeklyActivity data={data} />);
        
        // Should render one bar per day
        const bars = container.querySelectorAll("[class*='rounded-t']");
        expect(bars).toHaveLength(3);
    });

    it("shows day initials", () => {
        const data = [
            { day: "Monday", count: 5 },
            { day: "Tuesday", count: 3 },
        ];
        
        render(<WeeklyActivity data={data} />);
        
        expect(screen.getByText("M")).toBeInTheDocument();
        expect(screen.getByText("T")).toBeInTheDocument();
    });
});

describe("ActivityIndicator", () => {
    it("shows active state", () => {
        const { container } = render(<ActivityIndicator isActive={true} />);
        
        // Should have pulsing animation div
        const pulsingElements = container.querySelectorAll(".animate-ping");
        expect(pulsingElements.length).toBe(1);
    });

    it("shows inactive state", () => {
        const { container } = render(<ActivityIndicator isActive={false} />);
        
        // Should not have pulsing animation
        const pulsingElements = container.querySelectorAll(".animate-ping");
        expect(pulsingElements.length).toBe(0);
    });
});

describe("CompactStats", () => {
    it("renders all stats", () => {
        const stats = [
            { label: "Tasks", value: 10 },
            { label: "Done", value: "5" },
            { label: "Rate", value: "50%" },
        ];
        
        render(<CompactStats stats={stats} />);
        
        expect(screen.getByText("Tasks")).toBeInTheDocument();
        expect(screen.getByText("10")).toBeInTheDocument();
        expect(screen.getByText("Done")).toBeInTheDocument();
        expect(screen.getByText("5")).toBeInTheDocument();
        expect(screen.getByText("Rate")).toBeInTheDocument();
        expect(screen.getByText("50%")).toBeInTheDocument();
    });

    it("renders icons when provided", () => {
        const stats = [
            { label: "Test", value: 1, icon: <Target data-testid="stat-icon" /> },
        ];
        
        render(<CompactStats stats={stats} />);
        
        expect(screen.getByTestId("stat-icon")).toBeInTheDocument();
    });
});
