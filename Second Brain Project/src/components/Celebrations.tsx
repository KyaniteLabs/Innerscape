"use client";

import { useEffect, useState, useCallback } from "react";
import { Check, Flame, Star, Sparkles, Zap } from "lucide-react";

// ===== CONFETTI =====

interface ConfettiPiece {
    id: number;
    x: number;
    color: string;
    delay: number;
    duration: number;
}

const CONFETTI_COLORS = [
    "#06B6D4", // Teal
    "#A78BFA", // Purple
    "#F472B6", // Pink
    "#A3E635", // Lime
    "#FB7185", // Coral
    "#FBBF24", // Amber
    "#34D399", // Emerald
];

interface ConfettiProps {
    isActive: boolean;
    duration?: number;
    pieceCount?: number;
    onComplete?: () => void;
}

export function Confetti({ 
    isActive, 
    duration = 3000, 
    pieceCount = 50,
    onComplete 
}: ConfettiProps) {
    const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

    useEffect(() => {
        if (isActive) {
            const newPieces: ConfettiPiece[] = Array.from({ length: pieceCount }, (_, i) => ({
                id: i,
                x: Math.random() * 100,
                color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
                delay: Math.random() * 0.5,
                duration: 2 + Math.random() * 2,
            }));
            setPieces(newPieces);

            const timer = setTimeout(() => {
                setPieces([]);
                onComplete?.();
            }, duration);

            return () => clearTimeout(timer);
        } else {
            setPieces([]);
        }
    }, [isActive, duration, pieceCount, onComplete]);

    if (pieces.length === 0) return null;

    return (
        <div 
            className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden"
            aria-hidden="true"
        >
            {pieces.map((piece) => (
                <div
                    key={piece.id}
                    className="absolute w-3 h-3"
                    style={{
                        left: `${piece.x}%`,
                        top: "-20px",
                        backgroundColor: piece.color,
                        borderRadius: Math.random() > 0.5 ? "50%" : "2px",
                        transform: `rotate(${Math.random() * 360}deg)`,
                        animation: `confettiFall ${piece.duration}s ease-out ${piece.delay}s forwards`,
                    }}
                />
            ))}
        </div>
    );
}

// ===== SUCCESS CHECK =====

interface SuccessCheckProps {
    isVisible: boolean;
    size?: number;
    onComplete?: () => void;
}

export function SuccessCheck({ isVisible, size = 48, onComplete }: SuccessCheckProps) {
    useEffect(() => {
        if (isVisible && onComplete) {
            const timer = setTimeout(onComplete, 600);
            return () => clearTimeout(timer);
        }
    }, [isVisible, onComplete]);

    if (!isVisible) return null;

    return (
        <div 
            className="inline-flex items-center justify-center animate-pop"
            style={{
                width: size,
                height: size,
                background: "var(--gradient-primary)",
                borderRadius: "50%",
                boxShadow: "var(--glow-success)",
            }}
        >
            <Check 
                size={size * 0.5} 
                strokeWidth={3}
                className="text-white"
                style={{
                    animation: "checkDraw 0.3s ease-out 0.2s both",
                }}
            />
        </div>
    );
}

// ===== GLOW PULSE =====

interface GlowPulseProps {
    isActive: boolean;
    color?: string;
    children: React.ReactNode;
}

export function GlowPulse({ isActive, color = "var(--primary)", children }: GlowPulseProps) {
    return (
        <div
            className="relative"
            style={{
                animation: isActive ? "glow 1.5s ease-in-out infinite" : "none",
                "--glow-color": color,
            } as React.CSSProperties}
        >
            {children}
            {isActive && (
                <div
                    className="absolute inset-0 rounded-inherit pointer-events-none"
                    style={{
                        background: `radial-gradient(circle, ${color}20 0%, transparent 70%)`,
                        animation: "pulse 1.5s ease-in-out infinite",
                    }}
                />
            )}
        </div>
    );
}

// ===== STREAK COUNTER =====

interface StreakCounterProps {
    count: number;
    label?: string;
    showFire?: boolean;
    size?: "sm" | "md" | "lg";
}

export function StreakCounter({ 
    count, 
    label = "day streak", 
    showFire = true,
    size = "md" 
}: StreakCounterProps) {
    const sizeClasses = {
        sm: "text-sm px-2 py-1",
        md: "text-base px-3 py-1.5",
        lg: "text-lg px-4 py-2",
    };

    const iconSizes = {
        sm: 14,
        md: 18,
        lg: 22,
    };

    if (count === 0) return null;

    return (
        <div 
            className={`streak-badge ${sizeClasses[size]}`}
            title={`${count} ${label}`}
        >
            {showFire && (
                <Flame 
                    size={iconSizes[size]} 
                    className="streak-fire streak-fire-enhanced"
                    fill="currentColor"
                />
            )}
            <span className="font-bold">{count}</span>
            {size !== "sm" && (
                <span className="opacity-80 font-normal">{label}</span>
            )}
        </div>
    );
}

// ===== MILESTONE CELEBRATION =====

interface MilestoneCelebrationProps {
    milestone: number;
    current: number;
    label?: string;
    icon?: "star" | "sparkles" | "zap";
    onMilestoneReached?: () => void;
}

export function MilestoneCelebration({
    milestone,
    current,
    label = "milestone reached!",
    icon = "star",
    onMilestoneReached,
}: MilestoneCelebrationProps) {
    const [showCelebration, setShowCelebration] = useState(false);
    const [hasTriggered, setHasTriggered] = useState(false);

    useEffect(() => {
        if (current >= milestone && !hasTriggered) {
            setShowCelebration(true);
            setHasTriggered(true);
            onMilestoneReached?.();
            
            const timer = setTimeout(() => {
                setShowCelebration(false);
            }, 3000);
            
            return () => clearTimeout(timer);
        }
    }, [current, milestone, hasTriggered, onMilestoneReached]);

    const Icon = icon === "star" ? Star : icon === "sparkles" ? Sparkles : Zap;

    if (!showCelebration) return null;

    return (
        <>
            <Confetti isActive={showCelebration} pieceCount={30} />
            <div 
                className="fixed inset-0 flex items-center justify-center z-[9998] pointer-events-none"
                aria-live="polite"
            >
                <div 
                    className="bg-surface border border-border rounded-lg p-6 text-center animate-pop"
                    style={{ boxShadow: "var(--glow-celebration)" }}
                >
                    <div 
                        className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                        style={{ background: "var(--gradient-celebration)" }}
                    >
                        <Icon size={32} className="text-white" />
                    </div>
                    <p className="text-2xl font-bold text-gradient mb-2">{milestone}</p>
                    <p className="text-muted">{label}</p>
                </div>
            </div>
        </>
    );
}

// ===== NUMBER COUNTER (Animated) =====

interface AnimatedCounterProps {
    value: number;
    duration?: number;
    prefix?: string;
    suffix?: string;
    className?: string;
}

export function AnimatedCounter({ 
    value, 
    duration = 1000, 
    prefix = "",
    suffix = "",
    className = ""
}: AnimatedCounterProps) {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        const startTime = Date.now();
        const startValue = displayValue;
        const endValue = value;
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(startValue + (endValue - startValue) * eased);
            
            setDisplayValue(current);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }, [value, duration]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <span className={className}>
            {prefix}{displayValue.toLocaleString()}{suffix}
        </span>
    );
}

// ===== CELEBRATION TOAST =====

interface CelebrationToastProps {
    message: string;
    type?: "success" | "streak" | "milestone";
    isVisible: boolean;
    onClose?: () => void;
}

export function CelebrationToast({ 
    message, 
    type = "success", 
    isVisible,
    onClose 
}: CelebrationToastProps) {
    useEffect(() => {
        if (isVisible && onClose) {
            const timer = setTimeout(onClose, 3000);
            return () => clearTimeout(timer);
        }
    }, [isVisible, onClose]);

    if (!isVisible) return null;

    const backgrounds = {
        success: "var(--gradient-primary)",
        streak: "var(--gradient-streak)",
        milestone: "var(--gradient-celebration)",
    };

    const icons = {
        success: Check,
        streak: Flame,
        milestone: Star,
    };

    const Icon = icons[type];

    return (
        <div 
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] animate-slideIn"
            role="alert"
        >
            <div 
                className="flex items-center gap-3 px-4 py-3 rounded-full text-white font-medium shadow-lg"
                style={{ 
                    background: backgrounds[type],
                    boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
                }}
            >
                <Icon size={20} className={type === "streak" ? "streak-fire" : ""} />
                <span>{message}</span>
            </div>
        </div>
    );
}

// ===== HOOK: useConfetti =====

export function useConfetti() {
    const [isActive, setIsActive] = useState(false);

    const trigger = useCallback(() => {
        setIsActive(true);
    }, []);

    const stop = useCallback(() => {
        setIsActive(false);
    }, []);

    return {
        isActive,
        trigger,
        stop,
        Confetti: () => <Confetti isActive={isActive} onComplete={stop} />,
    };
}

// ===== HOOK: useCelebration =====

interface CelebrationOptions {
    confetti?: boolean;
    toast?: {
        message: string;
        type?: "success" | "streak" | "milestone";
    };
    sound?: boolean;
}

export function useCelebration() {
    const [showConfetti, setShowConfetti] = useState(false);
    const [toast, setToast] = useState<{
        message: string;
        type: "success" | "streak" | "milestone";
        visible: boolean;
    } | null>(null);

    const celebrate = useCallback((options: CelebrationOptions) => {
        if (options.confetti) {
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 3000);
        }

        if (options.toast) {
            setToast({
                message: options.toast.message,
                type: options.toast.type || "success",
                visible: true,
            });
            setTimeout(() => setToast(null), 3000);
        }

        // Future: Add sound support
        // if (options.sound) { ... }
    }, []);

    const CelebrationElements = useCallback(() => (
        <>
            <Confetti isActive={showConfetti} />
            {toast && (
                <CelebrationToast
                    message={toast.message}
                    type={toast.type}
                    isVisible={toast.visible}
                    onClose={() => setToast(null)}
                />
            )}
        </>
    ), [showConfetti, toast]);

    return { celebrate, CelebrationElements };
}
