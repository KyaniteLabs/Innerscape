/**
 * Skeleton Components
 * 
 * Loading placeholder components for better perceived performance.
 * Available: Skeleton, CardSkeleton, ProjectGridSkeleton, ListSkeleton, StatsSkeleton
 * 
 * Usage:
 *   import { CardSkeleton, ListSkeleton } from "@/components/Skeleton";
 *   {isLoading ? <ListSkeleton count={5} /> : <ActualList />}
 */

"use client";

interface SkeletonProps {
    className?: string;
    style?: React.CSSProperties;
}

export function Skeleton({ className = "", style }: SkeletonProps) {
    return (
        <div
            className={`animate-pulse ${className}`}
            style={{
                background: "var(--bg-elevated)",
                borderRadius: "8px",
                ...style,
            }}
        />
    );
}

export function CardSkeleton() {
    return (
        <div className="card" style={{ padding: "16px" }}>
            <Skeleton style={{ width: "60px", height: "12px", marginBottom: "12px" }} />
            <Skeleton style={{ width: "100%", height: "18px", marginBottom: "8px" }} />
            <Skeleton style={{ width: "80%", height: "14px" }} />
        </div>
    );
}

export function ProjectGridSkeleton({ count = 4 }: { count?: number }) {
    return (
        <div className="project-grid">
            {Array.from({ length: count }).map((_, i) => (
                <CardSkeleton key={i} />
            ))}
        </div>
    );
}

export function ListSkeleton({ count = 5 }: { count?: number }) {
    return (
        <div className="stack-sm">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="card" style={{ padding: "16px" }}>
                    <div className="flex items-center gap-2 mb-2">
                        <Skeleton style={{ width: "14px", height: "14px", borderRadius: "50%" }} />
                        <Skeleton style={{ width: "60px", height: "16px" }} />
                    </div>
                    <Skeleton style={{ width: "100%", height: "16px", marginBottom: "8px" }} />
                    <Skeleton style={{ width: "40%", height: "12px" }} />
                </div>
            ))}
        </div>
    );
}

export function StatsSkeleton() {
    return (
        <div className="flex gap-4" style={{ flexWrap: "wrap" }}>
            {Array.from({ length: 3 }).map((_, i) => (
                <div 
                    key={i}
                    className="card flex items-center gap-3" 
                    style={{ padding: "12px 16px", flex: "1", minWidth: "140px" }}
                >
                    <Skeleton style={{ width: "18px", height: "18px", borderRadius: "4px" }} />
                    <div>
                        <Skeleton style={{ width: "50px", height: "10px", marginBottom: "4px" }} />
                        <Skeleton style={{ width: "30px", height: "16px" }} />
                    </div>
                </div>
            ))}
        </div>
    );
}
