/**
 * Application Configuration
 * NeuroSecond - Executive Function Prosthetic
 */

const isServer = typeof window === "undefined";

const getEnv = (key: string, defaultValue?: string, required = false): string => {
    const value = process.env[key] || defaultValue;
    // Only throw for required vars on server-side (client doesn't have access to secrets)
    if (required && !value && isServer) {
        throw new Error(`[APEX] [Config] Missing required environment variable: ${key}`);
    }
    return value || "";
};

const getBoolEnv = (key: string, defaultValue: boolean = false): boolean => {
    const value = process.env[key];
    if (value === undefined) return defaultValue;
    return value === "true" || value === "1";
};

export const CONFIG = {
    // Single user ID for personal tool
    SINGLE_USER_ID: getEnv("NEXT_PUBLIC_USER_ID", "personal"),
    
    // Database configuration
    DB: {
        URL: getEnv("DATABASE_URL", "file:local.db"),
        RETRY_DELAY_MS: 1000,
        MAX_RETRIES: 3,
    },
    
    // Toast configuration
    TOAST: {
        DEFAULT_DURATION: 4000,
    },
    
    // Queue configuration
    QUEUE: {
        REDIS_URL: getEnv("REDIS_URL"),
        REDIS_MAX_RETRIES: 3,
        REDIS_BASE_DELAY_MS: 1000,
        REDIS_MAX_DELAY_MS: 3000,
        JOB_MAX_ATTEMPTS: 3,
        JOB_BACKOFF_DELAY_MS: 1000,
        COMPLETED_JOBS_TO_KEEP: 100,
        FAILED_JOBS_TO_KEEP: 50,
    },
    
    // AI/Agent configuration - GLM-4.7
    AI: {
        // API Configuration
        API_KEY: getEnv("GLM_API_KEY", undefined, true), // Required
        API_BASE_URL: getEnv("GLM_API_BASE_URL", "https://api.z.ai/api/coding/paas/v4/"),
        
        // Model Configuration
        DEFAULT_MODEL: "GLM-4.7",           // Flagship model with agent capabilities
        FAST_MODEL: "GLM-4.7",              // Use same model for coding plan
        
        // Classification Settings
        CONFIDENCE_THRESHOLD: 0.6,
        
        // Request Settings
        TIMEOUT_MS: 30000,                   // Increased for agent reasoning
        MAX_RETRIES: 2,
        RETRY_DELAY_MS: 1000,
        
        // GLM-4.7 Specific Settings
        THINKING_MODE: "enabled" as const,   // Enable deep thinking for complex captures
        TEMPERATURE: 0.7,                    // Balanced for agent reasoning
        MAX_TOKENS: 4096,                    // Ample for structured responses
        
        // Tool Streaming (GLM-4.7 feature)
        TOOL_STREAM: true,                   // Stream tool call parameters
        
        // Token Limits for Different Contexts
        TOKENS: {
            CHAT_CONTEXT_RESERVE: 5000,      // Reserved tokens for system prompt, tools, context
            CHAT_RESPONSE: 1024,             // Max tokens for chat responses
            CONTENT_REFRESH: 2000,           // Max tokens for content refresh
            SUMMARY: 1500,                   // Max tokens for summaries
        },
    },
    
    // Agent Configuration
    AGENT: {
        // Feature Flags
        ENABLED: getBoolEnv("AGENT_ENABLED", true),
        USE_LEGACY_CLASSIFIER: getBoolEnv("USE_LEGACY_CLASSIFIER", false),
        
        // Context Settings
        MAX_CONTEXT_ITEMS: 10,               // Recent items for context
        SESSION_TIMEOUT_MS: 30 * 60 * 1000,  // 30 minutes
        
        // Memory Settings
        MEMORY_ENABLED: getBoolEnv("AGENT_MEMORY_ENABLED", true),
        MAX_MEMORY_ITEMS: 100,
        
        // Semantic Search Settings
        EMBEDDING_MODEL: "Xenova/all-MiniLM-L6-v2",
        SIMILARITY_THRESHOLD: 0.5,
        MAX_SEARCH_RESULTS: 5,
        SNIPPET_LENGTH: 100,                 // Max characters for search snippets
        
        // ADHD-Friendly Settings
        MAX_OPTIONS_SHOWN: 3,                // Never overwhelm with choices
        CHUNK_SIZE: 3,                       // Max items in a list
        RESPONSE_STYLE: "bluf" as const,     // Bottom Line Up Front
    },
    
    // HTTP Status Codes
    HTTP: {
        OK: 200,
        CREATED: 201,
        NO_CONTENT: 204,
        BAD_REQUEST: 400,
        UNAUTHORIZED: 401,
        FORBIDDEN: 403,
        NOT_FOUND: 404,
        CONFLICT: 409,
        UNPROCESSABLE_ENTITY: 422,
        TOO_MANY_REQUESTS: 429,
        INTERNAL_SERVER_ERROR: 500,
        BAD_GATEWAY: 502,
        SERVICE_UNAVAILABLE: 503,
    },
    
    // UI/UX Constants
    UI: {
        MINUTE_MS: 60000,
        HOUR_MS: 3600000,
        DAY_MS: 86400000,
        MOBILE_BREAKPOINT_PX: 1024,          // Width below which is considered mobile
        SHUTDOWN: {
            MINUTE_MS: 60000,
            HISTORY_LIMIT: 30,
        },
        CHAT: {
            FOCUS_DELAY_MS: 100,
            ERROR_CLEAR_DELAY_MS: 3000,
            COPY_FEEDBACK_DELAY_MS: 2000,
        },
        CAPTURE: {
            ANIMATION_DELAY_MS: 800,
            PHASE_TRANSITION_DELAY_MS: 1500,
            AUTO_DISMISS_DELAY_MS: 8000,     // Auto-dismiss capture feedback
        },
        THOUGHT_STREAM: {
            AUTO_COLLAPSE_DELAY_MS: 1500,    // Auto-collapse expanded thoughts
        },
        STATS: {
            REFRESH_INTERVAL_MS: 5 * 60 * 1000,
        },
    },
};

