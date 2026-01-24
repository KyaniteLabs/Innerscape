import type { Metadata, Viewport } from "next";
import { Sora, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ToastContainer } from "@/components/Toast";
import { ChatSidebar } from "@/components/ChatSidebar";
import { Providers } from "@/components/Providers";
import { ErrorBoundary, CompactErrorBoundary } from "@/components/ErrorBoundary";

const sora = Sora({
    subsets: ["latin"],
    variable: "--font-display",
    display: "swap",
    weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
    subsets: ["latin"],
    variable: "--font-mono",
    display: "swap",
    weight: ["400", "500"],
});

export const metadata: Metadata = {
    title: "NeuroSecond | Open Source Second Brain",
    description: "Executive prosthetic for neurodivergent minds",
    manifest: "/manifest.json",
    appleWebApp: {
        capable: true,
        statusBarStyle: "black-translucent",
        title: "NeuroSecond",
    },
    formatDetection: {
        telephone: false,
    },
};

export const viewport: Viewport = {
    themeColor: [
        { media: "(prefers-color-scheme: light)", color: "#fafafa" },
        { media: "(prefers-color-scheme: dark)", color: "#1a1a1a" },
    ],
    width: "device-width",
    initialScale: 1,
    maximumScale: 5, // Allow zoom for accessibility
    userScalable: true, // Allow user to zoom for accessibility
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning className={`${sora.variable} ${jetbrainsMono.variable}`}>
            <head>
                {/* Prevent theme flash - runs before React hydrates */}
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
                            (function() {
                                try {
                                    var stored = localStorage.getItem('neurosecond-theme');
                                    var theme = stored === 'light' ? 'light' : 
                                                stored === 'dark' ? 'dark' :
                                                (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                                    document.documentElement.setAttribute('data-theme', theme);
                                    document.documentElement.style.colorScheme = theme;
                                } catch (e) {
                                    document.documentElement.setAttribute('data-theme', 'dark');
                                }
                            })();
                        `,
                    }}
                />
                <link rel="icon" href="/favicon.ico" sizes="32x32" />
                <link rel="icon" href="/icon-192.png" type="image/png" sizes="192x192" />
                <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
            </head>
            <body className="antialiased min-h-screen bg-background text-foreground font-sans">
                {/* Skip to main content link for keyboard navigation */}
                <a href="#main-content" className="skip-link">
                    Skip to main content
                </a>
                
                <Providers>
                    <ErrorBoundary featureName="App">
                        {/* Main content wrapper with ID for skip link */}
                        <div id="main-content" tabIndex={-1}>
                            {children}
                        </div>
                        
                        {/* Live region for announcements (screen readers) */}
                        <div 
                            role="status" 
                            aria-live="polite" 
                            aria-atomic="true" 
                            className="sr-only"
                            id="live-announcer"
                        />
                        
                        <ToastContainer />
                        <CompactErrorBoundary featureName="Chat">
                            <ChatSidebar />
                        </CompactErrorBoundary>
                    </ErrorBoundary>
                </Providers>
                <ServiceWorkerRegistration />
            </body>
        </html>
    );
}

function ServiceWorkerRegistration() {
    return (
        <script
            dangerouslySetInnerHTML={{
                __html: `
                    if ('serviceWorker' in navigator) {
                        window.addEventListener('load', function() {
                            navigator.serviceWorker.register('/sw.js')
                                .then(function(registration) {
                                    console.log('[APEX] [App] Service Worker registered:', registration.scope);
                                })
                                .catch(function(err) {
                                    console.error('[APEX] [App] Service Worker registration failed:', err);
                                });
                        });
                    }
                `,
            }}
        />
    );
}
