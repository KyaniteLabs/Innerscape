/**
 * Push Notifications via Ntfy
 * 
 * Simple push notifications to your phone using ntfy.sh
 * 
 * Setup:
 * 1. Install ntfy app on your phone (iOS/Android)
 * 2. Subscribe to your topic in the app
 * 3. Set NTFY_TOPIC in .env.local
 * 
 * @see /docs/push-notifications.md
 */

const NTFY_TOPIC = process.env.NTFY_TOPIC;
const NTFY_SERVER = process.env.NTFY_SERVER || "https://ntfy.sh";

type NotificationPriority = "min" | "low" | "default" | "high" | "urgent";

interface NotificationOptions {
    title: string;
    message: string;
    priority?: NotificationPriority;
    tags?: string[];
    click?: string; // URL to open when clicked
}

/**
 * Send a push notification via ntfy
 */
export async function sendNotification({
    title,
    message,
    priority = "default",
    tags = ["brain"],
    click,
}: NotificationOptions): Promise<boolean> {
    if (!NTFY_TOPIC) {
        console.warn("[APEX] [Notifications] NTFY_TOPIC not configured, skipping notification");
        return false;
    }

    try {
        const headers: Record<string, string> = {
            "Title": title,
            "Priority": priority,
            "Tags": tags.join(","),
        };

        if (click) {
            headers["Click"] = click;
        }

        const response = await fetch(`${NTFY_SERVER}/${NTFY_TOPIC}`, {
            method: "POST",
            body: message,
            headers,
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        console.log(`[APEX] [Notifications] Sent: "${title}"`);
        return true;
    } catch (error) {
        console.error("[APEX] [Notifications] Failed to send:", error);
        return false;
    }
}

/**
 * Pre-configured notification types
 */
export const notify = {
    /**
     * Notify when a capture is classified
     */
    captured: (name: string, destination: string) =>
        sendNotification({
            title: "Captured! 🧠",
            message: `"${name.substring(0, 50)}${name.length > 50 ? "..." : ""}" → ${destination}`,
            priority: "default",
            tags: ["brain", "capture"],
        }),

    /**
     * Notify when items need review
     */
    needsReview: (count: number) =>
        sendNotification({
            title: "Review Needed",
            message: `${count} item${count > 1 ? "s" : ""} need${count === 1 ? "s" : ""} your attention`,
            priority: count > 5 ? "high" : "default",
            tags: ["brain", "review", "warning"],
        }),

    /**
     * Notify about due dates
     */
    dueToday: (taskName: string) =>
        sendNotification({
            title: "Due Today! ⏰",
            message: taskName,
            priority: "high",
            tags: ["brain", "due", "warning"],
        }),

    dueTomorrow: (taskName: string) =>
        sendNotification({
            title: "Due Tomorrow",
            message: taskName,
            priority: "default",
            tags: ["brain", "due"],
        }),

    /**
     * Notify when daily summary is ready
     */
    dailySummaryReady: () =>
        sendNotification({
            title: "Daily Summary Ready",
            message: "Your brain activity summary for today is available",
            priority: "low",
            tags: ["brain", "summary"],
        }),

    /**
     * Notify when optimization completes
     */
    optimizationComplete: (changes: number) =>
        sendNotification({
            title: "Brain Optimized ✨",
            message: `${changes} improvement${changes > 1 ? "s" : ""} applied`,
            priority: "min",
            tags: ["brain", "optimize"],
        }),

    /**
     * Custom notification
     */
    custom: sendNotification,
};

/**
 * Check if notifications are configured
 */
export function isNotificationsEnabled(): boolean {
    return Boolean(NTFY_TOPIC);
}
