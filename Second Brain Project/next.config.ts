import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    
    // Suppress noisy dev-mode warnings about async params (Next.js 16 issue)
    logging: {
        fetches: {
            fullUrl: false,
        },
    },
    
    // Disable dev indicators that cause param enumeration warnings
    devIndicators: false,
    
    async headers() {
        return [
            {
                source: "/(.*)",
                headers: [
                    {
                        key: "Cross-Origin-Opener-Policy",
                        value: "same-origin",
                    },
                    {
                        key: "Cross-Origin-Embedder-Policy",
                        value: "require-corp",
                    },
                ],
            },
        ];
    },
};

export default nextConfig;
