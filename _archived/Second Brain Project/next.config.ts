import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    // Explicitly disable Turbopack as we use Module Federation which requires Webpack
    turbopack: {},
    
    // Suppress noisy dev-mode warnings about async params (Next.js 16 issue)
    logging: {
        fetches: {
            fullUrl: false,
        },
    },
    
    // Disable dev indicators that cause param enumeration warnings
    devIndicators: false,
    
    webpack(config, options) {
        if (!options.isServer && process.env.ENABLE_FEDERATION === 'true') {
            const { NextFederationPlugin } = require('@module-federation/nextjs-mf');
            config.plugins.push(
                new NextFederationPlugin({
                    name: 'innerscape_shell',
                    filename: 'static/chunks/remoteEntry.js',
                    exposes: {
                        './UniversalNav': './src/components/shell/UniversalNav',
                    },
                    shared: {
                        react: { singleton: true, eager: true, requiredVersion: false },
                        'react-dom': { singleton: true, eager: true, requiredVersion: false },
                        '@clerk/nextjs': { singleton: true },
                        '@tanstack/react-query': { singleton: true },
                    },
                })
            );
        }
        return config;
    },

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
