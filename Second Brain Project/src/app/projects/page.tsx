"use client";

import { useProjects } from "@/lib/hooks/useData";
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Target, Plus, CheckCircle, Clock, AlertTriangle, Loader2, MoreHorizontal, Trash2, Pencil, X, Check, Calendar } from "lucide-react";

type ProjectStatus = "active" | "waiting" | "blocked" | "someday" | "completed";

export default function ProjectsPage() {
    const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
    const { projects, isLoading, error, refetch } = useProjects(statusFilter);
    const [showNewForm, setShowNewForm] = useState(false);
    const [newProjectName, setNewProjectName] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this project?")) return;
        setDeletingId(id);
        try {
            const res = await fetch(`/api/projects?id=${id}`, { method: "DELETE" });
            if (res.ok) {
                refetch();
            }
        } catch (err) {
            console.error("[Projects] Delete failed:", err);
        } finally {
            setDeletingId(null);
        }
    };

    const handleCreateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newProjectName.trim()) return;

        setIsCreating(true);
        try {
            const res = await fetch("/api/projects", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newProjectName.trim() }),
            });
            const data = await res.json();
            if (data.success) {
                setNewProjectName("");
                setShowNewForm(false);
                refetch();
            }
        } catch (err) {
            console.error("[Projects] Create failed:", err);
        } finally {
            setIsCreating(false);
        }
    };

    const getStatusIcon = (status: ProjectStatus) => {
        switch (status) {
            case "active": return <Target size={14} className="text-primary" />;
            case "completed": return <CheckCircle size={14} className="text-success" />;
            case "waiting": return <Clock size={14} className="text-accent" />;
            case "blocked": return <AlertTriangle size={14} className="text-destructive" />;
            case "someday": return <MoreHorizontal size={14} className="text-muted" />;
            default: return <Target size={14} className="text-muted" />;
        }
    };

    const getStatusColor = (status: ProjectStatus) => {
        const colors: Record<ProjectStatus, string> = {
            active: "var(--primary)",
            completed: "var(--success)",
            waiting: "var(--accent)",
            blocked: "var(--destructive)",
            someday: "var(--text-muted)",
        };
        return colors[status] || "var(--text-muted)";
    };

    const groupedProjects = projects.reduce((acc, project) => {
        const status = project.status || "active";
        if (!acc[status]) acc[status] = [];
        acc[status].push(project);
        return acc;
    }, {} as Record<string, typeof projects>);

    const statusOrder: ProjectStatus[] = ["active", "waiting", "blocked", "someday", "completed"];

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
                            <Target size={20} />
                        </div>
                        <div>
                            <h1 className="title">Projects</h1>
                            <p className="subtitle">{projects.length} total</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link 
                            href="/calendar" 
                            className="btn btn-secondary flex items-center gap-2 px-4 h-10 shadow-sm hover:border-primary transition-all group"
                            title="View Calendar"
                        >
                            <Calendar size={18} className="text-primary group-hover:scale-110 transition-transform" />
                            <span className="hidden md:inline font-medium">Calendar</span>
                        </Link>
                        <button 
                            onClick={() => setShowNewForm(true)}
                            className="btn btn-primary h-10 flex items-center gap-2 px-4 shadow-glow"
                        >
                            <Plus size={18} />
                            <span>New Project</span>
                        </button>
                    </div>
                </header>

                {/* New Project Form */}
                {showNewForm && (
                    <form onSubmit={handleCreateProject} className="card mb-6" style={{ padding: '16px' }}>
                        <p className="label mb-2">New Project</p>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newProjectName}
                                onChange={(e) => setNewProjectName(e.target.value)}
                                placeholder="Project name..."
                                className="input"
                                style={{ 
                                    flex: 1, 
                                    padding: '8px 12px',
                                    background: 'var(--bg-elevated)',
                                    borderRadius: '8px',
                                }}
                                autoFocus
                            />
                            <button 
                                type="submit" 
                                className="btn btn-primary"
                                disabled={isCreating || !newProjectName.trim()}
                            >
                                {isCreating ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : "Create"}
                            </button>
                            <button 
                                type="button"
                                onClick={() => setShowNewForm(false)}
                                className="btn btn-ghost"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                )}

                {/* Filters */}
                <div className="flex gap-2 mb-6" style={{ flexWrap: 'wrap' }}>
                    <button
                        onClick={() => setStatusFilter(undefined)}
                        className={`btn ${!statusFilter ? 'btn-primary' : 'btn-ghost'}`}
                        style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                    >
                        All
                    </button>
                    {statusOrder.slice(0, -1).map(status => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`btn ${statusFilter === status ? 'btn-primary' : 'btn-ghost'}`}
                            style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                        >
                            {getStatusIcon(status)}
                            <span style={{ marginLeft: '4px', textTransform: 'capitalize' }}>{status}</span>
                        </button>
                    ))}
                </div>

                {/* Content */}
                {isLoading ? (
                    <div className="flex items-center justify-center" style={{ padding: '64px', color: 'var(--text-muted)' }}>
                        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
                    </div>
                ) : error ? (
                    <div className="card" style={{ textAlign: 'center', padding: '32px' }}>
                        <AlertTriangle size={32} className="text-destructive" style={{ margin: '0 auto 12px' }} />
                        <p className="text-destructive">{error}</p>
                        <button onClick={() => refetch()} className="btn btn-ghost" style={{ marginTop: '12px' }}>
                            Try Again
                        </button>
                    </div>
                ) : projects.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
                        <Target size={48} className="text-muted" style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                        <p className="text-muted" style={{ fontSize: '1.125rem' }}>No projects yet</p>
                        <p className="text-xs text-muted" style={{ marginTop: '8px' }}>
                            Capture a thought or create a project manually
                        </p>
                        <button 
                            onClick={() => setShowNewForm(true)}
                            className="btn btn-primary" 
                            style={{ marginTop: '16px' }}
                        >
                            <Plus size={16} style={{ marginRight: '4px' }} />
                            Create Project
                        </button>
                    </div>
                ) : statusFilter ? (
                    // Flat list when filtered
                    <div className="stack-sm">
                        {projects.map((project) => (
                            <ProjectCard 
                                key={project.id} 
                                project={project} 
                                getStatusIcon={getStatusIcon} 
                                getStatusColor={getStatusColor}
                                onDelete={handleDelete}
                                deletingId={deletingId}
                                onEdit={setEditingId}
                                editingId={editingId}
                                refetch={refetch}
                            />
                        ))}
                    </div>
                ) : (
                    // Grouped by status when not filtered
                    <div className="stack">
                        {statusOrder.map(status => {
                            const statusProjects = groupedProjects[status];
                            if (!statusProjects || statusProjects.length === 0) return null;
                            
                            return (
                                <section key={status} className="stack-sm">
                                    <h2 className="section-title" style={{ textTransform: 'capitalize' }}>
                                        {getStatusIcon(status)}
                                        {status}
                                        <span className="text-xs text-muted" style={{ marginLeft: '8px' }}>
                                            ({statusProjects.length})
                                        </span>
                                    </h2>
                                    <div className="project-grid">
                                        {statusProjects.map((project) => (
                                            <ProjectCard 
                                                key={project.id} 
                                                project={project} 
                                                getStatusIcon={getStatusIcon} 
                                                getStatusColor={getStatusColor}
                                                onDelete={handleDelete}
                                                deletingId={deletingId}
                                                onEdit={setEditingId}
                                                editingId={editingId}
                                                refetch={refetch}
                                            />
                                        ))}
                                    </div>
                                </section>
                            );
                        })}
                    </div>
                )}

                {/* Footer */}
                <footer className="footer">
                    <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>← Back to Dashboard</Link>
                    <span>{projects.length} projects</span>
                </footer>
            </div>
        </main>
    );
}

function ProjectCard({ 
    project, 
    getStatusIcon, 
    getStatusColor,
    onDelete,
    deletingId,
    onEdit,
    editingId,
    refetch,
}: { 
    project: { id: string; name: string; status: ProjectStatus; nextAction: string | null; tags: string[]; notes: string | null };
    getStatusIcon: (status: ProjectStatus) => React.ReactNode;
    getStatusColor: (status: ProjectStatus) => string;
    onDelete: (id: string) => void;
    deletingId: string | null;
    onEdit: (id: string | null) => void;
    editingId: string | null;
    refetch: () => void;
}) {
    const [editName, setEditName] = useState(project.name);
    const [editNextAction, setEditNextAction] = useState(project.nextAction || "");
    const [editStatus, setEditStatus] = useState(project.status);
    const [isSaving, setIsSaving] = useState(false);

    const isEditing = editingId === project.id;

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch(`/api/projects?id=${project.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: editName.trim(),
                    nextAction: editNextAction.trim() || null,
                    status: editStatus,
                }),
            });
            if (res.ok) {
                onEdit(null);
                refetch();
            }
        } catch (err) {
            console.error("[Projects] Update failed:", err);
        } finally {
            setIsSaving(false);
        }
    };

    if (isEditing) {
        return (
            <div className="card" style={{ padding: '12px' }}>
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
                    <input
                        type="text"
                        value={editNextAction}
                        onChange={(e) => setEditNextAction(e.target.value)}
                        placeholder="Next action..."
                        className="input"
                        style={{ 
                            padding: '8px 12px',
                            background: 'var(--bg-elevated)',
                            borderRadius: '8px',
                        }}
                    />
                    <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value as ProjectStatus)}
                        className="input"
                        style={{ 
                            padding: '8px 12px',
                            background: 'var(--bg-elevated)',
                            borderRadius: '8px',
                        }}
                    >
                        <option value="active">Active</option>
                        <option value="waiting">Waiting</option>
                        <option value="blocked">Blocked</option>
                        <option value="someday">Someday</option>
                        <option value="completed">Completed</option>
                    </select>
                    <div className="flex gap-2">
                        <button 
                            onClick={handleSave}
                            className="btn btn-primary"
                            disabled={isSaving}
                        >
                            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Save
                        </button>
                        <button 
                            onClick={() => onEdit(null)}
                            className="btn btn-ghost"
                        >
                            <X size={16} /> Cancel
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="card group">
            <div className="flex items-center gap-2 mb-2">
                {getStatusIcon(project.status)}
                <span 
                    className="text-xs" 
                    style={{ 
                        color: getStatusColor(project.status),
                        textTransform: 'capitalize',
                    }}
                >
                    {project.status}
                </span>
                {project.tags?.[0] && (
                    <span className="label" style={{ marginLeft: 'auto' }}>
                        {project.tags[0]}
                    </span>
                )}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" style={{ marginLeft: project.tags?.[0] ? '8px' : 'auto' }}>
                    <button
                        onClick={() => onEdit(project.id)}
                        className="btn btn-ghost"
                        style={{ padding: '4px' }}
                        title="Edit"
                    >
                        <Pencil size={12} />
                    </button>
                    <button
                        onClick={() => onDelete(project.id)}
                        disabled={deletingId === project.id}
                        className="btn btn-ghost text-destructive"
                        style={{ padding: '4px' }}
                        title="Delete"
                    >
                        {deletingId === project.id ? (
                            <Loader2 size={12} className="animate-spin" />
                        ) : (
                            <Trash2 size={12} />
                        )}
                    </button>
                </div>
            </div>
            <h3 style={{ fontWeight: 500, marginBottom: '4px' }}>{project.name}</h3>
            <p className="text-sm text-muted">
                {project.nextAction || project.notes || "No details"}
            </p>
        </div>
    );
}
