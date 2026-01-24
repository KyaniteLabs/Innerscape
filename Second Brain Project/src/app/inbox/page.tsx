"use client";

import { useInbox } from "@/lib/hooks/useData";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useState, Suspense } from "react";
import { ArrowLeft, Inbox, CheckCircle, AlertCircle, Clock, Filter, RefreshCw, Loader2, Trash2 } from "lucide-react";

function InboxContent() {
    const searchParams = useSearchParams();
    const initialStatus = searchParams.get("status") || undefined;
    const [statusFilter, setStatusFilter] = useState<string | undefined>(initialStatus);
    const { items, isLoading, error, refetch } = useInbox(statusFilter);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await refetch();
        setIsRefreshing(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this item?")) return;
        
        setDeletingId(id);
        try {
            const res = await fetch(`/api/inbox?id=${id}`, { method: "DELETE" });
            if (res.ok) {
                await refetch();
            } else {
                const data = await res.json();
                alert(data.error || "Failed to delete");
            }
        } catch (err) {
            alert("Failed to delete item");
        } finally {
            setDeletingId(null);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "filed": return <CheckCircle size={14} className="text-success" />;
            case "needs_review": return <AlertCircle size={14} className="text-warning" />;
            case "pending": return <Clock size={14} className="text-muted" />;
            default: return <Inbox size={14} className="text-muted" />;
        }
    };

    const getStatusBadge = (status: string) => {
        const colors: Record<string, string> = {
            filed: "var(--success)",
            needs_review: "var(--warning)",
            pending: "var(--text-muted)",
            fixed: "var(--accent)",
        };
        return (
            <span style={{
                fontSize: '0.65rem',
                padding: '2px 6px',
                borderRadius: '4px',
                background: `${colors[status] || colors.pending}20`,
                color: colors[status] || colors.pending,
                textTransform: 'uppercase',
                fontWeight: 600,
            }}>
                {status.replace("_", " ")}
            </span>
        );
    };

    const getDestinationBadge = (destination: string | null) => {
        if (!destination) return null;
        const colors: Record<string, string> = {
            projects: "var(--primary)",
            people: "var(--accent)",
            ideas: "var(--warning)",
            admin: "var(--text-muted)",
        };
        return (
            <span style={{
                fontSize: '0.65rem',
                padding: '2px 6px',
                borderRadius: '4px',
                background: `${colors[destination] || 'var(--bg-elevated)'}20`,
                color: colors[destination] || 'var(--text-muted)',
                textTransform: 'uppercase',
                fontWeight: 600,
            }}>
                {destination}
            </span>
        );
    };

    return (
        <main>
            <div className="layout-container">
                {/* Header */}
                <header className="header">
                    <div className="header-brand">
                        <Link href="/" className="btn btn-ghost" style={{ marginRight: '8px' }}>
                            <ArrowLeft size={18} />
                        </Link>
                        <div className="header-icon">
                            <Inbox size={20} />
                        </div>
                        <div>
                            <h1 className="title">Inbox</h1>
                            <p className="subtitle">{items.length} captures</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button 
                            onClick={handleRefresh}
                            className="btn btn-ghost"
                            disabled={isRefreshing}
                        >
                            <RefreshCw size={18} className={isRefreshing ? "animate-spin" : ""} style={isRefreshing ? { animation: 'spin 1s linear infinite' } : {}} />
                        </button>
                    </div>
                </header>

                {/* Filters */}
                <div className="flex gap-2 mb-6" style={{ flexWrap: 'wrap' }}>
                    <button
                        onClick={() => setStatusFilter(undefined)}
                        className={`btn ${!statusFilter ? 'btn-primary' : 'btn-ghost'}`}
                        style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setStatusFilter("pending")}
                        className={`btn ${statusFilter === "pending" ? 'btn-primary' : 'btn-ghost'}`}
                        style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                    >
                        <Clock size={14} style={{ marginRight: '4px' }} />
                        Pending
                    </button>
                    <button
                        onClick={() => setStatusFilter("needs_review")}
                        className={`btn ${statusFilter === "needs_review" ? 'btn-primary' : 'btn-ghost'}`}
                        style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                    >
                        <AlertCircle size={14} style={{ marginRight: '4px' }} />
                        Needs Review
                    </button>
                    <button
                        onClick={() => setStatusFilter("filed")}
                        className={`btn ${statusFilter === "filed" ? 'btn-primary' : 'btn-ghost'}`}
                        style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                    >
                        <CheckCircle size={14} style={{ marginRight: '4px' }} />
                        Filed
                    </button>
                </div>

                {/* Content */}
                {isLoading ? (
                    <div className="flex items-center justify-center" style={{ padding: '64px', color: 'var(--text-muted)' }}>
                        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
                    </div>
                ) : error ? (
                    <div className="card" style={{ textAlign: 'center', padding: '32px' }}>
                        <AlertCircle size={32} className="text-destructive" style={{ margin: '0 auto 12px' }} />
                        <p className="text-destructive">{error}</p>
                        <button onClick={handleRefresh} className="btn btn-ghost" style={{ marginTop: '12px' }}>
                            Try Again
                        </button>
                    </div>
                ) : items.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
                        <Inbox size={48} className="text-muted" style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                        <p className="text-muted" style={{ fontSize: '1.125rem' }}>
                            {statusFilter ? `No ${statusFilter.replace("_", " ")} items` : "Inbox is empty"}
                        </p>
                        <p className="text-xs text-muted" style={{ marginTop: '8px' }}>
                            Capture a thought to get started
                        </p>
                        <Link href="/" className="btn btn-primary" style={{ marginTop: '16px' }}>
                            Go to Dashboard
                        </Link>
                    </div>
                ) : (
                    <div className="stack-sm">
                        {items.map((item) => (
                            <div key={item.id} className="card" style={{ padding: '16px', position: 'relative' }}>
                                <div className="flex items-center gap-2 mb-2">
                                    {getStatusIcon(item.status)}
                                    {getStatusBadge(item.status)}
                                    {getDestinationBadge(item.filedTo)}
                                    {item.confidence !== null && (
                                        <span className="text-xs text-muted" style={{ marginLeft: 'auto' }}>
                                            {item.confidence}% confidence
                                        </span>
                                    )}
                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        disabled={deletingId === item.id}
                                        style={{
                                            marginLeft: item.confidence === null ? 'auto' : '8px',
                                            padding: '4px 8px',
                                            background: 'transparent',
                                            border: '1px solid var(--border)',
                                            borderRadius: '4px',
                                            cursor: deletingId === item.id ? 'not-allowed' : 'pointer',
                                            color: 'var(--destructive, #ef4444)',
                                            opacity: deletingId === item.id ? 0.5 : 1,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            fontSize: '0.75rem',
                                        }}
                                        title="Delete item"
                                    >
                                        {deletingId === item.id ? (
                                            <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                                        ) : (
                                            <Trash2 size={14} />
                                        )}
                                    </button>
                                </div>
                                <p style={{ marginBottom: '8px' }}>{item.originalText}</p>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted">
                                        {item.captureSource || "web"}
                                    </span>
                                    <span className="text-xs text-muted">•</span>
                                    <span className="text-xs text-muted">
                                        {item.createdAt ? new Date(item.createdAt).toLocaleString() : "Unknown"}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Footer */}
                <footer className="footer">
                    <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>← Back to Dashboard</Link>
                    <span>{items.length} items</span>
                </footer>
            </div>
        </main>
    );
}

// Loading fallback for Suspense
function InboxLoading() {
    return (
        <main>
            <div className="layout-container">
                <div className="flex items-center justify-center" style={{ padding: '64px', color: 'var(--text-muted)' }}>
                    <Loader2 size={32} className="animate-spin" />
                </div>
            </div>
        </main>
    );
}

export default function InboxPage() {
    return (
        <Suspense fallback={<InboxLoading />}>
            <InboxContent />
        </Suspense>
    );
}
