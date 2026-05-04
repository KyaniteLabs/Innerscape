/**
 * EmptyState Components
 * 
 * Reusable empty state components for consistent UX across the app.
 * Available pre-configured states: EmptyInbox, EmptyProjects, EmptyIdeas, EmptyPeople, EmptyTasks
 * 
 * Usage:
 *   import { EmptyState, EmptyProjects } from "@/components/EmptyState";
 *   <EmptyProjects />
 *   // or custom:
 *   <EmptyState icon={MyIcon} title="No items" description="Add one" action={{ label: "Add", onClick: fn }} />
 */

"use client";

import { LucideIcon, Inbox, Target, Lightbulb, Users, CheckSquare } from "lucide-react";
import Link from "next/link";

interface EmptyStateProps {
    icon?: LucideIcon;
    title: string;
    description?: string;
    action?: {
        label: string;
        href?: string;
        onClick?: () => void;
    };
}

export function EmptyState({ icon: Icon = Inbox, title, description, action }: EmptyStateProps) {
    return (
        <div className="card" style={{ textAlign: "center", padding: "48px 24px" }}>
            <Icon 
                size={48} 
                className="text-muted" 
                style={{ margin: "0 auto 16px", opacity: 0.5 }} 
            />
            <p className="text-muted" style={{ fontSize: "1.125rem", marginBottom: "8px" }}>
                {title}
            </p>
            {description && (
                <p className="text-xs text-muted" style={{ marginBottom: "16px" }}>
                    {description}
                </p>
            )}
            {action && (
                action.href ? (
                    <Link href={action.href} className="btn btn-primary">
                        {action.label}
                    </Link>
                ) : (
                    <button onClick={action.onClick} className="btn btn-primary">
                        {action.label}
                    </button>
                )
            )}
        </div>
    );
}

// Pre-configured empty states for common scenarios
export function EmptyInbox() {
    return (
        <EmptyState
            icon={Inbox}
            title="Inbox is empty"
            description="Capture a thought to get started"
            action={{ label: "Go to Dashboard", href: "/" }}
        />
    );
}

export function EmptyProjects() {
    return (
        <EmptyState
            icon={Target}
            title="No projects yet"
            description="Capture a thought or create a project manually"
        />
    );
}

export function EmptyIdeas() {
    return (
        <EmptyState
            icon={Lightbulb}
            title="No ideas captured"
            description="Ideas are extracted from your captures automatically"
            action={{ label: "Capture Something", href: "/" }}
        />
    );
}

export function EmptyPeople() {
    return (
        <EmptyState
            icon={Users}
            title="No people entries"
            description="Mention someone in your captures to track relationships"
            action={{ label: "Capture Something", href: "/" }}
        />
    );
}

export function EmptyTasks() {
    return (
        <EmptyState
            icon={CheckSquare}
            title="No pending tasks"
            description="Nice work! All caught up."
        />
    );
}
