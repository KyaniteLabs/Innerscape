"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { 
    Send, Loader2, 
    Bot, User, Sparkles, HelpCircle, Trash2, ChevronLeft, ChevronRight,
    Mic, Square, Moon, Sun, Sunrise, Copy, Check, X, MessageCircle
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useWhisper } from "@/lib/hooks/useWhisper";
import { useTimeContext } from "@/lib/hooks/useAppContext";
import { CONFIG } from "@/lib/config";
import { safeJsonParse } from "@/lib/errors";

interface ChatMessage {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
}

// Time-based suggested questions
const TIME_QUESTIONS = {
    morning: [
        "What should I focus on today?",
        "Show me my pending tasks",
        "What's in my inbox?",
        "When am I most productive?",
    ],
    afternoon: [
        "How many tasks have I done today?",
        "What projects need attention?",
        "Show me recent captures",
        "How am I doing this week?",
    ],
    evening: [
        "Summarize what I captured today",
        "What should I review?",
        "How was my productivity today?",
        "What's pending for tomorrow?",
    ],
    night: [
        "What's left for tomorrow?",
        "Show me my active projects",
        "How was my week?",
        "Any items to review?",
    ],
};

// Fallback questions
const DEFAULT_QUESTIONS = [
    "What's in my second brain?",
    "How do I use voice capture?",
    "What tasks do I have?",
    "When am I most productive?",
];

const SIDEBAR_WIDTH = 380;

/**
 * ChatSidebar Component
 * 
 * Always-on chat panel on the right side with time-aware suggestions.
 * Now with new teal color scheme and clean CSS classes.
 */
export function ChatSidebar() {
    const [isOpen, setIsOpen] = useState(true);
    const [hasMounted, setHasMounted] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    
    // Get time context for suggested questions
    const { timeOfDay, isEvening, isLateNight } = useTimeContext();
    
    // Context-aware suggested questions
    const suggestedQuestions = useMemo(() => {
        return TIME_QUESTIONS[timeOfDay] || DEFAULT_QUESTIONS;
    }, [timeOfDay]);

    // Check for mobile on mount and resize
    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < CONFIG.UI.MOBILE_BREAKPOINT_PX;
            setIsMobile(mobile);
            // Auto-close on mobile by default
            if (mobile && !hasMounted) {
                setIsOpen(false);
            }
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, [hasMounted]);

    // Load preference from localStorage after mount
    useEffect(() => {
        setHasMounted(true);
        const saved = localStorage.getItem('neurosecond-chat-open');
        // On mobile, default to closed unless explicitly opened
        const mobile = window.innerWidth < CONFIG.UI.MOBILE_BREAKPOINT_PX;
        if (mobile) {
            setIsOpen(false);
        } else if (saved === 'false') {
            setIsOpen(false);
        }
    }, []);

    // Save open/closed preference
    useEffect(() => {
        if (hasMounted) {
            localStorage.setItem('neurosecond-chat-open', String(isOpen));
        }
    }, [isOpen, hasMounted]);

    // Adjust main content area when sidebar opens/closes
    useEffect(() => {
        if (hasMounted) {
            const isMobile = window.innerWidth < CONFIG.UI.MOBILE_BREAKPOINT_PX;
            if (!isMobile) {
                document.body.style.marginRight = isOpen ? `${SIDEBAR_WIDTH}px` : '0';
                document.body.style.transition = 'margin-right 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            } else {
                document.body.style.marginRight = '0';
            }
        }
        return () => {
            document.body.style.marginRight = '0';
        };
    }, [isOpen, hasMounted]);

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Voice input
    const { 
        isReady: isVoiceReady, 
        isRecording, 
        transcript, 
        error: voiceError,
        startRecording, 
        stopRecording,
        clearError: clearVoiceError 
    } = useWhisper();

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Focus input when sidebar opens
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), CONFIG.UI.CHAT.FOCUS_DELAY_MS);
        }
    }, [isOpen]);

    // Handle voice transcript
    useEffect(() => {
        if (transcript) {
            setInput(prev => prev ? `${prev} ${transcript}` : transcript);
            setTimeout(() => inputRef.current?.focus(), CONFIG.UI.CHAT.FOCUS_DELAY_MS);
        }
    }, [transcript]);

    // Clear voice error after some time
    useEffect(() => {
        if (voiceError) {
            const timer = setTimeout(clearVoiceError, CONFIG.UI.CHAT.ERROR_CLEAR_DELAY_MS);
            return () => clearTimeout(timer);
        }
    }, [voiceError, clearVoiceError]);

    // Load messages from localStorage
    useEffect(() => {
        const saved = localStorage.getItem("neurosecond-chat");
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setMessages(parsed.map((m: ChatMessage) => ({
                    ...m,
                    timestamp: new Date(m.timestamp),
                })));
            } catch {
                // Ignore parse errors
            }
        }
    }, []);

    // Save messages to localStorage
    useEffect(() => {
        if (messages.length > 0) {
            localStorage.setItem("neurosecond-chat", JSON.stringify(messages));
        }
    }, [messages]);

    const sendMessage = useCallback(async (text: string) => {
        if (!text.trim() || isLoading) return;

        const userMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: "user",
            content: text.trim(),
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            const apiMessages = [...messages, userMessage].map(m => ({
                role: m.role,
                content: m.content,
            }));

            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: apiMessages }),
            });

            const data = await safeJsonParse<{ message?: { content: string }; error?: string }>(response);

            if (!response.ok || !data.message) {
                throw new Error(data.error || "Failed to get response");
            }

            const assistantMessage: ChatMessage = {
                id: crypto.randomUUID(),
                role: "assistant",
                content: data.message.content,
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            console.error("[ChatSidebar] Error:", error);
            const errorMessage: ChatMessage = {
                id: crypto.randomUUID(),
                role: "assistant",
                content: "Sorry, I couldn't process that. Please try again.",
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    }, [messages, isLoading]);

    const [copiedId, setCopiedId] = useState<string | null>(null);

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), CONFIG.UI.CHAT.COPY_FEEDBACK_DELAY_MS);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        sendMessage(input);
    };

    const clearChat = () => {
        setMessages([]);
        localStorage.removeItem("neurosecond-chat");
    };

    // Get time-appropriate icon
    const TimeIcon = useMemo(() => {
        if (isLateNight) return Moon;
        if (isEvening) return Moon;
        if (timeOfDay === 'morning') return Sunrise;
        return Sun;
    }, [timeOfDay, isEvening, isLateNight]);

    return (
        <>
            {/* Mobile backdrop */}
            {isMobile && isOpen && (
                <div 
                    className="mobile-sidebar-backdrop"
                    onClick={() => setIsOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* Toggle Tab (desktop only) */}
            {!isMobile && (
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="sidebar-toggle focus-ring"
                    style={{
                        right: isOpen ? `${SIDEBAR_WIDTH}px` : '0',
                    }}
                    aria-label={isOpen ? "Collapse assistant" : "Expand assistant"}
                    title={isOpen ? "Collapse" : "Expand"}
                >
                    {isOpen ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                </button>
            )}

            {/* Sidebar Panel */}
            <aside 
                className={`sidebar ${!isOpen ? 'sidebar-closed' : ''}`}
                style={{ width: `${SIDEBAR_WIDTH}px` }}
                aria-label="Chat assistant"
            >
                {/* Header */}
                <header className="sidebar-header">
                    <div className="flex items-center gap-2">
                        <div className="icon-box-primary icon-box-sm">
                            <Sparkles size={18} />
                        </div>
                        <span className="font-semibold">Assistant</span>
                    </div>
                    <div className="flex items-center gap-1">
                        {messages.length > 0 && (
                            <button
                                onClick={clearChat}
                                className="btn btn-ghost btn-icon"
                                aria-label="Clear chat history"
                                title="Clear chat"
                            >
                                <Trash2 size={16} />
                            </button>
                        )}
                        {/* Close button for mobile */}
                        {isMobile && (
                            <button
                                onClick={() => setIsOpen(false)}
                                className="btn btn-ghost btn-icon"
                                aria-label="Close chat"
                                title="Close"
                            >
                                <X size={20} />
                            </button>
                        )}
                    </div>
                </header>

                {/* Messages Area */}
                <div className="sidebar-content">
                    {messages.length === 0 ? (
                        <div className="text-center py-8">
                            {/* Empty state icon */}
                            <div className="flex items-center justify-center mb-4">
                                <div 
                                    className="w-16 h-16 rounded-full flex items-center justify-center"
                                    style={{ background: 'var(--gradient-primary-subtle)' }}
                                >
                                    <TimeIcon size={28} className="text-primary" />
                                </div>
                            </div>
                            
                            {/* Greeting */}
                            <h3 className="font-semibold mb-2">
                                {isLateNight ? "Still up?" : isEvening ? "Evening check-in" : "Ask me anything!"}
                            </h3>
                            <p className="text-sm text-muted mb-6">
                                {isLateNight 
                                    ? "I can help wrap things up for tomorrow."
                                    : isEvening 
                                        ? "Let's review your day or plan for tomorrow."
                                        : "I can search your data, explain analytics, and help you stay organized."
                                }
                            </p>
                            
                            {/* Suggested Questions */}
                            <div className="stack-xs text-left">
                                <p className="label text-subtle mb-2">Try asking:</p>
                                {suggestedQuestions.map((q, i) => (
                                    <button
                                        key={i}
                                        onClick={() => sendMessage(q)}
                                        className="w-full p-3 bg-elevated rounded-lg text-sm text-left flex items-center gap-2 transition hover:bg-hover hover-lift"
                                    >
                                        <HelpCircle size={16} className="text-muted flex-shrink-0" />
                                        <span>{q}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="stack-sm">
                            {messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'} items-start mb-4`}
                                >
                                    {/* Avatar */}
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${
                                        message.role === 'assistant' 
                                            ? 'bg-gradient-primary text-white' 
                                            : 'bg-elevated border border-border'
                                    }`}>
                                        {message.role === 'assistant' ? <Bot size={20} /> : <User size={20} className="text-muted" />}
                                    </div>
                                    
                                    <div className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'} max-w-[85%]`}>
                                        {/* Message bubble */}
                                        <div className={`message-bubble relative group ${
                                            message.role === 'user' ? 'message-bubble-user' : 'message-bubble-assistant'
                                        }`}>
                                            {message.role === 'assistant' ? (
                                                <div className="markdown-content">
                                                    <ReactMarkdown>{message.content}</ReactMarkdown>
                                                </div>
                                            ) : (
                                                <div className="whitespace-pre-wrap">{message.content}</div>
                                            )}
                                            
                                            {/* Copy button overlay for assistant messages */}
                                            {message.role === 'assistant' && (
                                                <button
                                                    onClick={() => copyToClipboard(message.content, message.id)}
                                                    className={`absolute top-2 right-2 p-1.5 rounded-md bg-surface border border-border shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-hover ${copiedId === message.id ? 'text-success border-success/30' : 'text-muted'}`}
                                                    title="Copy message"
                                                >
                                                    {copiedId === message.id ? <Check size={14} /> : <Copy size={14} />}
                                                </button>
                                            )}
                                        </div>
                                        
                                        <span className="message-time px-1">
                                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            
                            {/* Loading indicator */}
                            {isLoading && (
                                <div className="flex gap-3 items-start">
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-primary text-white shadow-sm">
                                        <Bot size={20} />
                                    </div>
                                    <div className="p-4 bg-surface border border-border-subtle rounded-xl rounded-tl-none shadow-sm flex items-center gap-2">
                                        <div className="flex gap-1">
                                            <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0s' }} />
                                            <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.2s' }} />
                                            <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.4s' }} />
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <form onSubmit={handleSubmit} className="sidebar-footer">
                    {/* Voice error message */}
                    {voiceError && (
                        <div className="mb-2 p-2 rounded-lg text-xs border bg-destructive/10 border-destructive/30 text-destructive">
                            {voiceError.message}
                        </div>
                    )}

                    <div className="flex gap-2">
                        <input
                            ref={inputRef}
                            type="text"
                            value={isRecording ? "Listening..." : input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask anything..."
                            disabled={isLoading || isRecording}
                            className={`input flex-1 ${isRecording ? 'border-destructive bg-destructive/10 text-destructive' : ''}`}
                            aria-label="Chat message input"
                        />

                        {/* Mic Button */}
                        {isVoiceReady && (
                            <button
                                type="button"
                                onClick={isRecording ? stopRecording : startRecording}
                                disabled={isLoading}
                                className={`btn btn-icon ${isRecording ? 'bg-destructive text-white' : 'btn-secondary'}`}
                                aria-label={isRecording ? "Stop recording" : "Start voice input"}
                                title={isRecording ? "Stop recording" : "Voice input"}
                            >
                                {isRecording ? (
                                    <Square size={18} fill="currentColor" />
                                ) : (
                                    <Mic size={18} />
                                )}
                            </button>
                        )}

                        {/* Send Button */}
                        <button
                            type="submit"
                            disabled={!input.trim() || isLoading || isRecording}
                            className="btn btn-primary btn-icon"
                            aria-label="Send message"
                        >
                            {isLoading ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : (
                                <Send size={18} />
                            )}
                        </button>
                    </div>
                </form>
            </aside>

            {/* Mobile FAB to open chat */}
            {isMobile && !isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="mobile-chat-fab"
                    aria-label="Open chat assistant"
                    title="Chat"
                >
                    <MessageCircle size={24} />
                </button>
            )}
        </>
    );
}
