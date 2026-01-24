import type { Config } from "tailwindcss";

export default {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                // Core colors
                background: "var(--bg)",
                foreground: "var(--text)",
                surface: "var(--bg-surface)",
                elevated: "var(--bg-elevated)",
                
                // Primary - Bright Teal
                primary: {
                    DEFAULT: "var(--primary)",
                    light: "var(--primary-light)",
                    dark: "var(--primary-dark)",
                },
                
                // Accent (alias for primary)
                accent: "var(--accent)",
                
                // Text
                muted: "var(--text-muted)",
                subtle: "var(--text-subtle)",
                
                // Borders
                border: "var(--border)",
                "border-subtle": "var(--border-subtle)",
                
                // Status colors
                success: "var(--success)",
                warning: "var(--warning)",
                destructive: "var(--destructive)",
                info: "var(--info)",
                
                // Category colors - Multi-color system
                projects: "var(--color-projects)",
                people: "var(--color-people)",
                ideas: "var(--color-ideas)",
                tasks: "var(--color-tasks)",
                inbox: "var(--color-inbox)",
            },
            fontFamily: {
                sans: ["var(--font-display)", "system-ui", "sans-serif"],
                mono: ["var(--font-mono)", "monospace"],
            },
            borderRadius: {
                DEFAULT: "var(--radius)",
                sm: "var(--radius-sm)",
                lg: "var(--radius-lg)",
                full: "var(--radius-full)",
            },
            boxShadow: {
                sm: "var(--shadow-sm)",
                md: "var(--shadow-md)",
                lg: "var(--shadow-lg)",
                glow: "var(--shadow-glow)",
                "glow-primary": "var(--glow-primary)",
                "glow-success": "var(--glow-success)",
            },
            transitionDuration: {
                fast: "var(--duration-fast)",
                base: "var(--duration-base)",
                slow: "var(--duration-slow)",
            },
            animation: {
                "fade-in": "fadeIn 0.2s ease-out",
                "slide-in": "slideIn 0.2s ease-out",
                "slide-in-right": "slideInRight 0.3s ease-out",
                "pulse-glow": "glow 2s ease-in-out infinite",
                "pop": "successPop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
                "confetti": "confettiFall 3s ease-out forwards",
            },
            keyframes: {
                fadeIn: {
                    from: { opacity: "0" },
                    to: { opacity: "1" },
                },
                slideIn: {
                    from: { opacity: "0", transform: "translateY(-10px)" },
                    to: { opacity: "1", transform: "translateY(0)" },
                },
                slideInRight: {
                    from: { opacity: "0", transform: "translateX(20px)" },
                    to: { opacity: "1", transform: "translateX(0)" },
                },
                glow: {
                    "0%, 100%": { boxShadow: "var(--glow-primary)" },
                    "50%": { boxShadow: "0 0 30px rgba(var(--primary-rgb), 0.6)" },
                },
                successPop: {
                    "0%": { transform: "scale(0)", opacity: "0" },
                    "50%": { transform: "scale(1.2)" },
                    "100%": { transform: "scale(1)", opacity: "1" },
                },
                confettiFall: {
                    "0%": { transform: "translateY(-100%) rotate(0deg)", opacity: "1" },
                    "100%": { transform: "translateY(100vh) rotate(720deg)", opacity: "0" },
                },
            },
            backgroundImage: {
                "gradient-primary": "var(--gradient-primary)",
                "gradient-celebration": "var(--gradient-celebration)",
                "gradient-streak": "var(--gradient-streak)",
                "gradient-projects": "var(--gradient-projects)",
                "gradient-people": "var(--gradient-people)",
                "gradient-ideas": "var(--gradient-ideas)",
                "gradient-tasks": "var(--gradient-tasks)",
            },
        },
    },
    plugins: [],
} satisfies Config;
