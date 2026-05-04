"use client";

import { ReactNode } from "react";
import { AppContextProvider } from "@/lib/hooks/useAppContext";

interface ProvidersProps {
    children: ReactNode;
}

/**
 * Client-side providers wrapper
 * Wraps all client-side context providers for the app
 */
export function Providers({ children }: ProvidersProps) {
    return (
        <AppContextProvider>
            {children}
        </AppContextProvider>
    );
}
