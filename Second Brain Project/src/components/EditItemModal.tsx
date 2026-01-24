"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Check, Trash2, Loader2, AlertCircle, Calendar, Target, User, Lightbulb, Clock } from "lucide-react";
import { UnifiedItem } from "@/lib/hooks/useData";

interface EditItemModalProps {
    item: UnifiedItem;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function EditItemModal({ item, isOpen, onClose, onSuccess }: EditItemModalProps) {
    const [name, setName] = useState(item.name);
    const [content, setContent] = useState(item.content);
    const [dueDate, setDueDate] = useState(item.temporal.dueDate || "");
    const [status, setStatus] = useState(item.metadata.status || "");
    const [nextAction, setNextAction] = useState(item.metadata.nextAction || "");
    const [context, setContext] = useState(item.metadata.context || "");
    const [followUps, setFollowUps] = useState(item.metadata.followUps || "");
    const [oneLiner, setOneLiner] = useState(item.metadata.oneLiner || "");
    
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);

    // Track client-side mount for portal
    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    // Sync state if item changes
    useEffect(() => {
        setName(item.name);
        setContent(item.content);
        setDueDate(item.temporal.dueDate || "");
        setStatus(item.metadata.status || "");
        setNextAction(item.metadata.nextAction || "");
        setContext(item.metadata.context || "");
        setFollowUps(item.metadata.followUps || "");
        setOneLiner(item.metadata.oneLiner || "");
    }, [item]);

    if (!isOpen || !mounted) return null;

    const handleSave = async () => {
        setIsSaving(true);
        setError(null);
        
        try {
            const apiPath = item.type === "admin" ? "/api/tasks" : `/api/${item.type}`;
            
            const updates: Record<string, any> = {
                id: item.id,
                name: name.trim(),
            };

            // Type-specific updates
            if (item.type === "projects") {
                updates.status = status;
                updates.nextAction = nextAction;
                updates.notes = content;
                updates.dueDate = dueDate || null;
            } else if (item.type === "people") {
                updates.context = content;
                updates.followUps = followUps;
                updates.dueDate = dueDate || null;
            } else if (item.type === "ideas") {
                updates.oneLiner = oneLiner;
                updates.notes = content;
                updates.dueDate = dueDate || null;
            } else if (item.type === "admin") {
                updates.status = status;
                updates.notes = content;
                updates.dueDate = dueDate || null;
            }

            const res = await fetch(apiPath, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updates),
            });

            const data = await res.json();
            if (data.success || data.task) {
                onSuccess();
                onClose();
            } else {
                throw new Error(data.error || "Failed to save changes");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Update failed");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this? This cannot be undone.")) return;
        
        setIsDeleting(true);
        setError(null);
        
        try {
            const apiPath = item.type === "admin" ? "/api/tasks" : `/api/${item.type}`;
            const res = await fetch(`${apiPath}?id=${item.id}`, {
                method: "DELETE",
            });

            const data = await res.json();
            if (data.success || data.deleted) {
                onSuccess();
                onClose();
            } else {
                throw new Error(data.error || "Failed to delete");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Delete failed");
        } finally {
            setIsDeleting(false);
        }
    };

    const typeConfig = {
        projects: { icon: Target, color: 'var(--color-projects)', label: 'Project' },
        people: { icon: User, color: 'var(--color-people)', label: 'Person' },
        ideas: { icon: Lightbulb, color: 'var(--color-ideas)', label: 'Idea' },
        admin: { icon: Clock, color: 'var(--color-admin)', label: 'Task' },
    };

    const config = typeConfig[item.type];
    const Icon = config.icon;

    // Use portal to render at document body level to escape stacking contexts
    const modalContent = (
        <div 
            className="fixed inset-0 flex items-center justify-center p-4 animate-in fade-in duration-200"
            style={{ 
                zIndex: 99999,
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                backdropFilter: 'blur(4px)'
            }}
            onClick={onClose}
        >
            <div 
                className="w-full max-w-lg rounded-xl border border-border overflow-hidden animate-in zoom-in-95 duration-200"
                style={{
                    backgroundColor: 'var(--bg-surface, #1a1a2e)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                    position: 'relative',
                    zIndex: 1
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border" style={{ backgroundColor: 'var(--bg-elevated, #252540)' }}>
                    <div className="flex items-center gap-3">
                        <div className="icon-box-sm" style={{ background: `rgba(var(--${item.type}-rgb, 100, 100, 100), 0.15)`, color: config.color }}>
                            <Icon size={18} />
                        </div>
                        <div>
                            <h2 className="font-bold">Edit {config.label}</h2>
                            <p className="text-[10px] text-muted uppercase tracking-widest">Knowledge Node</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="btn btn-ghost btn-icon">
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar" style={{ backgroundColor: 'var(--bg-surface, #1a1a2e)' }}>
                    {error && (
                        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2 text-destructive text-sm">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="label text-subtle">Title</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="input text-lg font-medium"
                            placeholder="Give it a name..."
                            autoFocus
                        />
                    </div>

                    {item.type === "projects" && (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="label text-subtle">Status</label>
                                    <select 
                                        value={status} 
                                        onChange={(e) => setStatus(e.target.value)}
                                        className="input"
                                    >
                                        <option value="active">Active</option>
                                        <option value="waiting">Waiting</option>
                                        <option value="blocked">Blocked</option>
                                        <option value="someday">Someday</option>
                                        <option value="completed">Completed</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="label text-subtle">Due Date</label>
                                    <input
                                        type="date"
                                        value={dueDate ? dueDate.split('T')[0] : ""}
                                        onChange={(e) => setDueDate(e.target.value)}
                                        className="input"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="label text-subtle">Next Action</label>
                                <input
                                    type="text"
                                    value={nextAction}
                                    onChange={(e) => setNextAction(e.target.value)}
                                    className="input"
                                    placeholder="What is the very next physical step?"
                                />
                            </div>
                        </>
                    )}

                    {item.type === "people" && (
                        <div className="space-y-1">
                            <label className="label text-subtle">Follow-ups</label>
                            <input
                                type="text"
                                value={followUps}
                                onChange={(e) => setFollowUps(e.target.value)}
                                className="input"
                                placeholder="What do you need to follow up on?"
                            />
                        </div>
                    )}

                    {item.type === "ideas" && (
                        <div className="space-y-1">
                            <label className="label text-subtle">One-liner</label>
                            <input
                                type="text"
                                value={oneLiner}
                                onChange={(e) => setOneLiner(e.target.value)}
                                className="input"
                                placeholder="The core insight in one sentence..."
                            />
                        </div>
                    )}

                    {item.type === "admin" && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="label text-subtle">Status</label>
                                <select 
                                    value={status} 
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="input"
                                >
                                    <option value="todo">Pending</option>
                                    <option value="done">Completed</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="label text-subtle">Due Date</label>
                                <input
                                    type="date"
                                    value={dueDate ? dueDate.split('T')[0] : ""}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    className="input"
                                />
                            </div>
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="label text-subtle">
                            {item.type === "people" ? "Context / Notes" : "Additional Notes"}
                        </label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="input min-h-[120px] resize-none"
                            placeholder="Add more details..."
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-border flex items-center justify-between gap-3" style={{ backgroundColor: 'var(--bg-elevated, #252540)' }}>
                    <button 
                        onClick={handleDelete}
                        disabled={isSaving || isDeleting}
                        className="btn btn-ghost text-destructive hover:bg-destructive/10"
                    >
                        {isDeleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                        <span className="hidden sm:inline ml-2">Delete</span>
                    </button>
                    
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={onClose}
                            className="btn btn-ghost"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleSave}
                            disabled={isSaving || isDeleting || !name.trim()}
                            className="btn btn-primary min-w-[100px]"
                        >
                            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                            <span className="ml-2">Save Changes</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    // Render using portal to escape stacking contexts
    return createPortal(modalContent, document.body);
}
