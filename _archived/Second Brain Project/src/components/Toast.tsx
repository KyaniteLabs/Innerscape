"use client";

import { useToast, ToastType } from "@/lib/hooks/useToast";
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from "lucide-react";

const iconMap: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle size={18} />,
    error: <AlertCircle size={18} />,
    info: <Info size={18} />,
    warning: <AlertTriangle size={18} />,
};

const colorMap: Record<ToastType, string> = {
    success: "var(--success)",
    error: "var(--destructive)",
    info: "var(--accent)",
    warning: "var(--warning)",
};

export function ToastContainer() {
    const { toasts, removeToast } = useToast();

    if (toasts.length === 0) return null;

    return (
        <div
            className="flex flex-col gap-2 z-9999 bottom-24 right-24 max-w-380 w-full"
            style={{
                position: "fixed",
                pointerEvents: "none",
            }}
        >
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className="card animate-slideIn flex items-start gap-3 p-3"
                    style={{
                        borderColor: colorMap[toast.type],
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                        pointerEvents: "auto",
                    }}
                >
                    <div 
                        className="mt-1 flex-shrink-0"
                        style={{ color: colorMap[toast.type] }}
                    >
                        {iconMap[toast.type]}
                    </div>
                    <p className="flex-1 text-sm leading-relaxed">
                        {toast.message}
                    </p>
                    <button
                        onClick={() => removeToast(toast.id)}
                        className="flex-shrink-0 text-muted p-0 cursor-pointer"
                        style={{ background: 'none', border: 'none' }}
                    >
                        <X size={16} />
                    </button>
                </div>
            ))}
        </div>
    );
}
