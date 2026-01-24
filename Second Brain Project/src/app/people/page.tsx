"use client";

import { usePeople } from "@/lib/hooks/useData";
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Users, Plus, Loader2, AlertTriangle, Trash2, Pencil, X, Check, User } from "lucide-react";

interface Person {
    id: string;
    name: string;
    context: string | null;
    followUps: string | null;
    tags: string[];
    lastTouched: string | null;
}

export default function PeoplePage() {
    const { people, isLoading, error, refetch } = usePeople();
    const [showNewForm, setShowNewForm] = useState(false);
    const [newPersonName, setNewPersonName] = useState("");
    const [newPersonContext, setNewPersonContext] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState("");
    const [editContext, setEditContext] = useState("");
    const [editFollowUps, setEditFollowUps] = useState("");
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleCreatePerson = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPersonName.trim()) return;

        setIsCreating(true);
        try {
            const res = await fetch("/api/people", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    name: newPersonName.trim(),
                    context: newPersonContext.trim() || null,
                }),
            });
            if (res.ok) {
                setNewPersonName("");
                setNewPersonContext("");
                setShowNewForm(false);
                refetch();
            }
        } catch (err) {
            console.error("[People] Create failed:", err);
        } finally {
            setIsCreating(false);
        }
    };

    const handleEdit = (person: Person) => {
        setEditingId(person.id);
        setEditName(person.name);
        setEditContext(person.context || "");
        setEditFollowUps(person.followUps || "");
    };

    const handleSaveEdit = async (id: string) => {
        try {
            const res = await fetch(`/api/people?id=${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: editName.trim(),
                    context: editContext.trim() || null,
                    followUps: editFollowUps.trim() || null,
                }),
            });
            if (res.ok) {
                setEditingId(null);
                refetch();
            }
        } catch (err) {
            console.error("[People] Update failed:", err);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this person?")) return;
        setDeletingId(id);
        try {
            const res = await fetch(`/api/people?id=${id}`, { method: "DELETE" });
            if (res.ok) {
                refetch();
            }
        } catch (err) {
            console.error("[People] Delete failed:", err);
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
                            <Users size={20} />
                        </div>
                        <div>
                            <h1 className="title">People</h1>
                            <p className="subtitle">{people.length} contacts</p>
                        </div>
                    </div>

                    <button 
                        onClick={() => setShowNewForm(true)}
                        className="btn btn-primary"
                    >
                        <Plus size={18} />
                    </button>
                </header>

                {/* New Person Form */}
                {showNewForm && (
                    <form onSubmit={handleCreatePerson} className="card mb-6" style={{ padding: '16px' }}>
                        <p className="label mb-2">New Person</p>
                        <div className="stack-sm">
                            <input
                                type="text"
                                value={newPersonName}
                                onChange={(e) => setNewPersonName(e.target.value)}
                                placeholder="Name..."
                                className="input"
                                style={{ 
                                    padding: '8px 12px',
                                    background: 'var(--bg-elevated)',
                                    borderRadius: '8px',
                                }}
                                autoFocus
                            />
                            <textarea
                                value={newPersonContext}
                                onChange={(e) => setNewPersonContext(e.target.value)}
                                placeholder="Context (who is this person, how you met, etc.)..."
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
                                    disabled={isCreating || !newPersonName.trim()}
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
                ) : people.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
                        <Users size={48} className="text-muted" style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                        <p className="text-muted" style={{ fontSize: '1.125rem' }}>No people yet</p>
                        <p className="text-xs text-muted" style={{ marginTop: '8px' }}>
                            Capture a thought about someone or add them manually
                        </p>
                        <button 
                            onClick={() => setShowNewForm(true)}
                            className="btn btn-primary" 
                            style={{ marginTop: '16px' }}
                        >
                            <Plus size={16} style={{ marginRight: '4px' }} />
                            Add Person
                        </button>
                    </div>
                ) : (
                    <div className="stack-sm">
                        {people.map((person) => (
                            <div key={person.id} className="card group" style={{ padding: '16px' }}>
                                {editingId === person.id ? (
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
                                            value={editContext}
                                            onChange={(e) => setEditContext(e.target.value)}
                                            placeholder="Context..."
                                            className="input"
                                            style={{ 
                                                padding: '8px 12px',
                                                background: 'var(--bg-elevated)',
                                                borderRadius: '8px',
                                                minHeight: '60px',
                                                resize: 'vertical',
                                            }}
                                        />
                                        <textarea
                                            value={editFollowUps}
                                            onChange={(e) => setEditFollowUps(e.target.value)}
                                            placeholder="Follow-ups..."
                                            className="input"
                                            style={{ 
                                                padding: '8px 12px',
                                                background: 'var(--bg-elevated)',
                                                borderRadius: '8px',
                                                minHeight: '40px',
                                                resize: 'vertical',
                                            }}
                                        />
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => handleSaveEdit(person.id)}
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
                                        <div className="flex items-start gap-3">
                                            <div 
                                                className="flex items-center justify-center"
                                                style={{
                                                    width: '40px',
                                                    height: '40px',
                                                    borderRadius: '50%',
                                                    background: 'var(--primary)',
                                                    opacity: 0.2,
                                                    flexShrink: 0,
                                                }}
                                            >
                                                <User size={20} style={{ color: 'var(--primary)' }} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 style={{ fontWeight: 500, marginBottom: '4px' }}>{person.name}</h3>
                                                {person.context && (
                                                    <p className="text-sm text-muted" style={{ marginBottom: '8px' }}>
                                                        {person.context}
                                                    </p>
                                                )}
                                                {person.followUps && (
                                                    <div 
                                                        className="text-xs"
                                                        style={{ 
                                                            padding: '6px 10px',
                                                            background: 'var(--bg-elevated)',
                                                            borderRadius: '6px',
                                                            marginBottom: '8px',
                                                        }}
                                                    >
                                                        <span className="text-muted">Follow-ups: </span>
                                                        {person.followUps}
                                                    </div>
                                                )}
                                                <p className="text-xs text-muted">
                                                    Last touched: {formatDate(person.lastTouched)}
                                                </p>
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleEdit(person)}
                                                    className="btn btn-ghost"
                                                    style={{ padding: '6px' }}
                                                    title="Edit"
                                                >
                                                    <Pencil size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(person.id)}
                                                    disabled={deletingId === person.id}
                                                    className="btn btn-ghost text-destructive"
                                                    style={{ padding: '6px' }}
                                                    title="Delete"
                                                >
                                                    {deletingId === person.id ? (
                                                        <Loader2 size={14} className="animate-spin" />
                                                    ) : (
                                                        <Trash2 size={14} />
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Footer */}
                <footer className="footer">
                    <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>← Back to Dashboard</Link>
                    <span>{people.length} people</span>
                </footer>
            </div>
        </main>
    );
}
