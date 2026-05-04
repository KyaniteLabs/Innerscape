/**
 * Rate Limiter Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
    rateLimit,
    rateLimitMultiple,
    getRateLimitHeaders,
    rateLimitedResponse,
    resetRateLimit,
    resetAllRateLimits,
    getRateLimitStatus,
    RATE_LIMITS,
} from "./rate-limit";

describe("Rate Limiter", () => {
    beforeEach(() => {
        resetAllRateLimits();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
        resetAllRateLimits();
    });

    describe("rateLimit", () => {
        it("allows requests within limit", () => {
            const result = rateLimit("capture");

            expect(result.success).toBe(true);
            expect(result.remaining).toBe(RATE_LIMITS.capture.requests - 1);
        });

        it("tracks requests across multiple calls", () => {
            // Make 5 requests
            for (let i = 0; i < 5; i++) {
                rateLimit("capture");
            }

            const result = rateLimit("capture");
            expect(result.success).toBe(true);
            expect(result.remaining).toBe(RATE_LIMITS.capture.requests - 6);
        });

        it("blocks requests when limit exceeded", () => {
            // Use up all allowed requests
            for (let i = 0; i < RATE_LIMITS.capture.requests; i++) {
                rateLimit("capture");
            }

            const result = rateLimit("capture");
            expect(result.success).toBe(false);
            expect(result.remaining).toBe(0);
            expect(result.retryAfter).toBeDefined();
        });

        it("resets after window expires", () => {
            // Use up all requests
            for (let i = 0; i < RATE_LIMITS.capture.requests; i++) {
                rateLimit("capture");
            }

            // Verify blocked
            expect(rateLimit("capture").success).toBe(false);

            // Advance time past window
            vi.advanceTimersByTime(RATE_LIMITS.capture.windowMs + 100);

            // Should be allowed again
            const result = rateLimit("capture");
            expect(result.success).toBe(true);
            expect(result.remaining).toBe(RATE_LIMITS.capture.requests - 1);
        });

        it("tracks different clients separately", () => {
            // Client A uses all requests
            for (let i = 0; i < RATE_LIMITS.capture.requests; i++) {
                rateLimit("capture", "client-a");
            }

            // Client A should be blocked
            expect(rateLimit("capture", "client-a").success).toBe(false);

            // Client B should still be allowed
            expect(rateLimit("capture", "client-b").success).toBe(true);
        });

        it("tracks different categories separately", () => {
            // Use up capture limit
            for (let i = 0; i < RATE_LIMITS.capture.requests; i++) {
                rateLimit("capture");
            }

            // Capture should be blocked
            expect(rateLimit("capture").success).toBe(false);

            // Chat should still be allowed
            expect(rateLimit("chat").success).toBe(true);
        });

        it("uses correct limits for each category", () => {
            expect(RATE_LIMITS.capture.requests).toBe(20);
            expect(RATE_LIMITS.chat.requests).toBe(30);
            expect(RATE_LIMITS.optimize.requests).toBe(5);
            expect(RATE_LIMITS.standard.requests).toBe(100);
        });
    });

    describe("rateLimitMultiple", () => {
        it("checks multiple categories at once", () => {
            const result = rateLimitMultiple(["capture", "burst"]);

            expect(result.success).toBe(true);
        });

        it("returns most restrictive result", () => {
            // Use up burst limit (most restrictive)
            for (let i = 0; i < RATE_LIMITS.burst.requests; i++) {
                rateLimit("burst");
            }

            const result = rateLimitMultiple(["capture", "burst"]);
            expect(result.success).toBe(false);
        });
    });

    describe("getRateLimitHeaders", () => {
        it("returns correct headers", () => {
            const result = {
                success: true,
                limit: 20,
                remaining: 15,
                reset: 1700000000,
            };

            const headers = getRateLimitHeaders(result);

            expect(headers["X-RateLimit-Limit"]).toBe("20");
            expect(headers["X-RateLimit-Remaining"]).toBe("15");
            expect(headers["X-RateLimit-Reset"]).toBe("1700000000");
        });

        it("includes Retry-After when limited", () => {
            const result = {
                success: false,
                limit: 20,
                remaining: 0,
                reset: 1700000000,
                retryAfter: 30,
            };

            const headers = getRateLimitHeaders(result);

            expect(headers["Retry-After"]).toBe("30");
        });
    });

    describe("rateLimitedResponse", () => {
        it("returns 429 status", async () => {
            const result = {
                success: false,
                limit: 20,
                remaining: 0,
                reset: 1700000000,
                retryAfter: 30,
            };

            const response = rateLimitedResponse(result);

            expect(response.status).toBe(429);
        });

        it("includes error message in body", async () => {
            const result = {
                success: false,
                limit: 20,
                remaining: 0,
                reset: 1700000000,
                retryAfter: 30,
            };

            const response = rateLimitedResponse(result);
            const body = await response.json();

            expect(body.success).toBe(false);
            expect(body.error).toBe("RATE_LIMIT_EXCEEDED");
            expect(body.retryAfter).toBe(30);
        });

        it("includes rate limit headers", async () => {
            const result = {
                success: false,
                limit: 20,
                remaining: 0,
                reset: 1700000000,
                retryAfter: 30,
            };

            const response = rateLimitedResponse(result);

            expect(response.headers.get("X-RateLimit-Limit")).toBe("20");
            expect(response.headers.get("Retry-After")).toBe("30");
        });
    });

    describe("resetRateLimit", () => {
        it("resets specific category for client", () => {
            // Use up limit
            for (let i = 0; i < RATE_LIMITS.capture.requests; i++) {
                rateLimit("capture", "test-client");
            }

            expect(rateLimit("capture", "test-client").success).toBe(false);

            // Reset
            resetRateLimit("capture", "test-client");

            // Should be allowed again
            expect(rateLimit("capture", "test-client").success).toBe(true);
        });
    });

    describe("resetAllRateLimits", () => {
        it("resets all limits", () => {
            // Use up multiple limits
            for (let i = 0; i < RATE_LIMITS.capture.requests; i++) {
                rateLimit("capture");
            }
            for (let i = 0; i < RATE_LIMITS.chat.requests; i++) {
                rateLimit("chat");
            }

            expect(rateLimit("capture").success).toBe(false);
            expect(rateLimit("chat").success).toBe(false);

            // Reset all
            resetAllRateLimits();

            // Both should be allowed again
            expect(rateLimit("capture").success).toBe(true);
            expect(rateLimit("chat").success).toBe(true);
        });
    });

    describe("getRateLimitStatus", () => {
        it("returns current status without incrementing", () => {
            // Make some requests
            rateLimit("capture");
            rateLimit("capture");

            const status1 = getRateLimitStatus("capture");
            const status2 = getRateLimitStatus("capture");

            // Should be the same (no increment)
            expect(status1.remaining).toBe(status2.remaining);
            expect(status1.remaining).toBe(RATE_LIMITS.capture.requests - 2);
        });

        it("returns full limit for fresh category", () => {
            const status = getRateLimitStatus("analytics");

            expect(status.success).toBe(true);
            expect(status.remaining).toBe(RATE_LIMITS.analytics.requests);
        });
    });

    describe("edge cases", () => {
        it("handles rapid requests correctly", () => {
            const results = [];
            
            // Make requests as fast as possible
            for (let i = 0; i < 25; i++) {
                results.push(rateLimit("capture"));
            }

            // First 20 should succeed
            expect(results.slice(0, 20).every(r => r.success)).toBe(true);
            
            // Rest should fail
            expect(results.slice(20).every(r => !r.success)).toBe(true);
        });

        it("handles empty client id", () => {
            const result = rateLimit("capture", "");
            expect(result.success).toBe(true);
        });

        it("logs warning when rate limited", () => {
            const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

            // Use up limit
            for (let i = 0; i <= RATE_LIMITS.capture.requests; i++) {
                rateLimit("capture", "warn-test");
            }

            expect(warnSpy).toHaveBeenCalled();
            expect(warnSpy.mock.calls[0][0]).toContain("[APEX] [RateLimit]");

            warnSpy.mockRestore();
        });
    });
});
