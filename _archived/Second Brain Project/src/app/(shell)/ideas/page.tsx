"use client";

import { useIdeas } from "@/lib/hooks/useData";
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Lightbulb, Plus, Loader2, AlertTriangle, Trash2, Pencil, X, Check, Sparkles } from "lucide-react";

interface Idea {
    id: string;
    name: string;
    oneLiner: string | null;
    notes: string | null;
    tags: string[];
    lastTouched: string | null;
}

export default function IdeasPage() {
    const { ideas, isLoading, error, refetch } = useIdeas();
    const [showNewForm, setShowNewForm] = useState(false);
    const [newIdeaName, setNewIdeaName] = useState("");
    const [newIdeaOneLiner, setNewIdeaOneLiner] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState("");
    const [editOneLiner, setEditOneLiner] = useState("");
    const [editNotes, setEditNotes] = useState("");
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleCreateIdea = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newIdeaName.trim()) return;

        setIsCreating(true);
        try {
            const res = await fetch("/api/ideas", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    name: newIdeaName.trim(),
                    oneLiner: newIdeaOneLiner.trim() || null,
                }),
            });
            if (res.ok) {
                setNewIdeaName("");
                setNewIdeaOneLiner("");
                setShowNewForm(false);
                refetch();
            }
        } catch (err) {
            console.error("[Ideas] Create failed:", err);
        } finally {
            setIsCreating(false);
        }
    };

    const handleEdit = (idea: Idea) => {
        setEditingId(idea.id);
        setEditName(idea.name);
        setEditOneLiner(idea.oneLiner || "");
        setEditNotes(idea.notes || "");
    };

    const handleSaveEdit = async (id: string) => {
        try {
            const res = await fetch(`/api/ideas?id=${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: editName.trim(),
                    oneLiner: editOneLiner.trim() || null,
                    notes: editNotes.trim() || null,
                }),
            });
            if (res.ok) {
                setEditingId(null);
                refetch();
            }
        } catch (err) {
            console.error("[Ideas] Update failed:", err);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this idea?")) return;
        setDeletingId(id);
        try {
            const res = await fetch(`/api/ideas?id=${id}`, { method: "DELETE" });
            if (res.ok) {
                refetch();
            }
        } catch (err) {
            console.error("[Ideas] Delete failed:", err);
        } finally {
            setDeletingId(null);
        }
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return "Never";
        const date = new Date(dateStr);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 0) return "Today";
        if (diffDays === 1) return "Yesterday";
        if (diffDays < 7) return `${diffDays} days ago`;
        return date.toLocaleDateString();
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
                            <Lightbulb size={20} />
                        </div>
                        <div>
                            <h1 className="title">Ideas</h1>
                            <p className="subtitle">{ideas.length} captured</p>
                        </div>
                    </div>

                    <button 
                        onClick={() => setShowNewForm(true)}
                        className="btn btn-primary"
                    >
                        <Plus size={18} />
                    </button>
                </header>

                {/* New Idea Form */}
                {showNewForm && (
                    <form onSubmit={handleCreateIdea} className="card mb-6" style={{ padding: '16px' }}>
                        <p className="label mb-2">New Idea</p>
                        <div className="stack-sm">
                            <input
                                type="text"
                                value={newIdeaName}
                                onChange={(e) => setNewIdeaName(e.target.value)}
                                placeholder="Idea title..."
                                className="input"
                                style={{ 
                                    padding: '8px 12px',
                                    background: 'var(--bg-elevated)',
                                    borderRadius: '8px',
                                }}
                                autoFocus
                            />
                            <textarea
                                value={newIdeaOneLiner}
                                onChange={(e) => setNewIdeaOneLiner(e.target.value)}
                                placeholder="One-liner summary..."
                                className="input"
                                style={{ 
                                    padding: '8px 12px',
                                    background: 'var(--bg-elevated)',
                                    borderRadius: '8px',
                                    minHeight: '60px',
                                    resize: 'vertical',
                                }}
                            />
                            <div className="flex gap-2">
                                <button 
                                    type="submit" 
                                    className="btn btn-primary"
                                    disabled={isCreating || !newIdeaName.trim()}
                                >
                                    {isCreating ? <Loader2 size={18} className="animate-spin" /> : "Create"}
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => setShowNewForm(false)}
                                    className="btn btn-ghost"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </form>
                )}

                {/* Content */}
                {isLoading ? (
                    <div className="flex items-center justify-center" style={{ padding: '64px', color: 'var(--text-muted)' }}>
                        <Loader2 size={32} className="animate-spin" />
                    </div>
                ) : error ? (
                    <div className="card" style={{ textAlign: 'center', padding: '32px' }}>
                        <AlertTriangle size={32} className="text-destructive" style={{ margin: '0 auto 12px' }} />
                        <p className="text-destructive">{error}</p>
                        <button onClick={() => refetch()} className="btn btn-ghost" style={{ marginTop: '12px' }}>
                            Try Again
                        </button>
                    </div>
                ) : ideas.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
                        <Lightbulb size={48} className="text-muted" style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                        <p className="text-muted" style={{ fontSize: '1.125rem' }}>No ideas yet</p>
                        <p className="text-xs text-muted" style={{ marginTop: '8px' }}>
                            Capture a creative thought or add one manually
                        </p>
                        <button 
                            onClick={() => setShowNewForm(true)}
                            className="btn btn-primary" 
                            style={{ marginTop: '16px' }}
                        >
                            <Plus size={16} style={{ marginRight: '4px' }} />
                            Add Idea
                        </button>
                    </div>
                ) : (
                    <div className="project-grid">
                        {ideas.map((idea) => (
                            <div key={idea.id} className="card group" style={{ padding: '16px' }}>
                                {editingId === idea.id ? (
                                    // Edit mode
                                    <div className="stack-sm">
                                        <input
                                            type="text"
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            className="input"
                                            style={{ 
                                                padding: '8px 12px',
                                                background: 'var(--bg-elevated)',
                                                borderRadius: '8px',
                                                fontWeight: 500,
                                            }}
                                            autoFocus
                                        />
                                        <textarea
                                            value={editOneLiner}
                                            onChange={(e) => setEditOneLiner(e.target.value)}
                                            placeholder="One-liner..."
                                            className="input"
                                            style={{ 
                                                padding: '8px 12px',
                                                background: 'var(--bg-elevated)',
                                                borderRadius: '8px',
                                                minHeight: '40px',
                                                resize: 'vertical',
                                            }}
                                        />
                                        <textarea
                                            value={editNotes}
                                            onChange={(e) => setEditNotes(e.target.value)}
                                            placeholder="Notes..."
                                            className="input"
                                            style={{ 
                                                padding: '8px 12px',
                                                background: 'var(--bg-elevated)',
                                                borderRadius: '8px',
                                                minHeight: '60px',
                                                resize: 'vertical',
                                            }}
                                        />
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => handleSaveEdit(idea.id)}
                                                className="btn btn-primary"
                                            >
                                                <Check size={16} /> Save
                                            </button>
                                            <button 
                                                onClick={() => setEditingId(null)}
                                                className="btn btn-ghost"
                                            >
                                                <X size={16} /> Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    // View mode
                                    <>
                                        <div className="flex items-start gap-2 mb-2">
                                            <Sparkles size={16} className="text-accent" style={{ marginTop: '2px', flexShrink: 0 }} />
                                            <h3 style={{ fontWeight: 500, flex: 1 }}>{idea.name}</h3>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleEdit(idea)}
                                                    className="btn btn-ghost"
                                                    style={{ padding: '4px' }}
                                                    title="Edit"
                                                >
                                                    <Pencil size={12} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(idea.id)}
                                                    disabled={deletingId === idea.id}
                                                    className="btn btn-ghost text-destructive"
                                                    style={{ padding: '4px' }}
                                                    title="Delete"
                                                >
                                                    {deletingId === idea.id ? (
                                                        <Loader2 size={12} className="animate-spin" />
                                                    ) : (
                                                        <Trash2 size={12} />
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                        {idea.oneLiner && (
                                            <p className="text-sm text-muted" style={{ marginBottom: '8px' }}>
                                                {idea.oneLiner}
                                            </p>
                                        )}
                                        {idea.notes && (
                                            <div 
                                                className="text-xs"
                                                style={{ 
                                                    padding: '6px 10px',
                                                    background: 'var(--bg-elevated)',
                                                    borderRadius: '6px',
                                                    marginBottom: '8px',
                                                }}
                                            >
                                                {idea.notes}
                                            </div>
                                        )}
                                        <p className="text-xs text-muted">
                                            {formatDate(idea.lastTouched)}
                                        </p>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Footer */}
                <footer className="footer">
                    <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>← Back to Dashboard</Link>
                    <span>{ideas.length} ideas</span>
                </footer>
            </div>
        </main>
    );
}
