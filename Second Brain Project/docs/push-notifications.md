# Push Notifications Setup

Send notifications from your Second Brain to your phone.

## Option 1: Ntfy (Recommended - Simple & Free)

**Self-hostable, or use ntfy.sh for free.**

### Setup

1. **Install ntfy app on your phone:**
   - iOS: App Store → ntfy
   - Android: Play Store → ntfy

2. **Subscribe to a topic:**
   - Open the app
   - Add subscription: `your-secret-topic-name` (make it unique!)
   - Use ntfy.sh as the server (or self-host)

3. **Send notifications from Second Brain:**

The app can send notifications via a simple HTTP request:

```typescript
// In your code:
await fetch('https://ntfy.sh/your-secret-topic-name', {
    method: 'POST',
    body: 'New task captured: Buy groceries',
    headers: {
        'Title': 'Second Brain',
        'Priority': 'default',
        'Tags': 'brain,capture'
    }
});
```

### Integration Points

Good places to trigger notifications:
- When a capture is classified
- When a due date is approaching
- When the daily summary is ready
- When the system needs your attention (items stuck in review)

---

## Option 2: Web Push (Browser Native)

**Works in browsers, requires VAPID keys.**

### Setup

1. **Generate VAPID keys:**
```bash
npx web-push generate-vapid-keys
```

2. **Add to `.env.local`:**
```
VAPID_PUBLIC_KEY=your_public_key
VAPID_PRIVATE_KEY=your_private_key
VAPID_SUBJECT=mailto:you@example.com
```

3. **Install web-push:**
```bash
npm install web-push
```

4. **Update service worker** to handle push events.

5. **Request notification permission** in the app.

(More complex - use ntfy if you want quick setup)

---

## Option 3: Telegram Bot

**Free, reliable, works everywhere.**

### Setup

1. **Create a bot:**
   - Message @BotFather on Telegram
   - Send `/newbot`
   - Name it "Second Brain Bot"
   - Save the token

2. **Get your chat ID:**
   - Message your bot
   - Visit: `https://api.telegram.org/bot<TOKEN>/getUpdates`
   - Find your `chat.id`

3. **Send notifications:**
```typescript
await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        chat_id: YOUR_CHAT_ID,
        text: '🧠 New capture: Buy groceries',
        parse_mode: 'HTML'
    })
});
```

---

## Quick Implementation: Ntfy

Add this to your project:

```typescript
// src/lib/notifications.ts
const NTFY_TOPIC = process.env.NTFY_TOPIC || 'your-secret-topic';
const NTFY_SERVER = process.env.NTFY_SERVER || 'https://ntfy.sh';

export async function sendNotification(
    title: string,
    message: string,
    priority: 'min' | 'low' | 'default' | 'high' | 'urgent' = 'default'
) {
    try {
        await fetch(`${NTFY_SERVER}/${NTFY_TOPIC}`, {
            method: 'POST',
            body: message,
            headers: {
                'Title': title,
                'Priority': priority,
                'Tags': 'brain'
            }
        });
        console.log('[APEX] Notification sent:', title);
    } catch (error) {
        console.error('[APEX] Failed to send notification:', error);
    }
}
```

Then use it:
```typescript
import { sendNotification } from '@/lib/notifications';

// After capture is classified:
await sendNotification(
    'Captured!', 
    `"${text}" → ${destination}`,
    'default'
);

// For urgent items:
await sendNotification(
    '⚠️ Review Needed',
    `${count} items need your attention`,
    'high'
);
```

Add to `.env.local`:
```
NTFY_TOPIC=your-unique-secret-topic
```

---

## When to Notify

Recommended notification triggers:

| Event | Priority | Message |
|-------|----------|---------|
| Capture classified | default | "Captured: {name} → {destination}" |
| Due date today | high | "Due today: {task name}" |
| Due date tomorrow | default | "Due tomorrow: {task name}" |
| Items need review | default | "{count} items need review" |
| Daily summary ready | low | "Your daily summary is ready" |
| Optimization complete | min | "Brain optimized: {changes} improvements" |

Don't over-notify - the goal is to help, not annoy!
