"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

interface ErrorBoundaryProps {
    children: ReactNode;
    /** Optional fallback component to render on error */
    fallback?: ReactNode;
    /** Optional callback when error is caught */
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
    /** Feature name for logging */
    featureName?: string;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary Component
 * 
 * Catches JavaScript errors in child component tree and displays
 * a fallback UI instead of crashing the whole app.
 * 
 * Usage:
 * ```tsx
 * <ErrorBoundary featureName="Chat">
 *   <ChatSidebar />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        const { onError, featureName } = this.props;
        
        // Log error
        console.error(
            `[APEX] [ErrorBoundary]${featureName ? ` [${featureName}]` : ""} Error caught:`,
            error,
            errorInfo
        );
        
        // Store error info for display
        this.setState({ errorInfo });
        
        // Call optional callback
        onError?.(error, errorInfo);
    }

    handleRetry = (): void => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
    };

    render(): ReactNode {
        const { hasError, error } = this.state;
        const { children, fallback, featureName } = this.props;

        if (hasError) {
            // Return custom fallback if provided
            if (fallback) {
                return fallback;
            }

            // Default error UI
            return (
                <div className="flex flex-col items-center justify-center p-6 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 m-4">
                    <AlertCircle className="w-12 h-12 text-red-500 dark:text-red-400 mb-4" />
                    <h2 className="text-lg font-semibold text-red-700 dark:text-red-300 mb-2">
                        {featureName ? `${featureName} Error` : "Something went wrong"}
                    </h2>
                    <p className="text-sm text-red-600 dark:text-red-400 text-center mb-4 max-w-md">
                        {error?.message || "An unexpected error occurred. Please try again."}
                    </p>
                    <button
                        onClick={this.handleRetry}
                        className="flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 rounded-lg hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Try Again
                    </button>
                    {process.env.NODE_ENV === "development" && error && (
                        <details className="mt-4 text-xs text-red-500 dark:text-red-400 max-w-lg">
                            <summary className="cursor-pointer hover:underline">
                                Technical Details
                            </summary>
                            <pre className="mt-2 p-2 bg-red-100 dark:bg-red-900/50 rounded overflow-auto max-h-40">
                                {error.stack}
                            </pre>
                        </details>
                    )}
                </div>
            );
        }

        return children;
    }
}

/**
 * Compact error boundary for smaller features
 */
export function CompactErrorBoundary({
    children,
    featureName,
}: {
    children: ReactNode;
    featureName?: string;
}) {
    return (
        <ErrorBoundary
            featureName={featureName}
            fallback={
                <div className="flex items-center gap-2 p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>
                        {featureName ? `${featureName} failed to load` : "Failed to load"}
                    </span>
                </div>
            }
        >
            {children}
        </ErrorBoundary>
    );
}

export default ErrorBoundary;
