# Capture From Anywhere

Send content to your Second Brain from email, text, or any app.

## Webhook Endpoint

Your Second Brain has a capture webhook at:

```
POST https://your-domain.com/api/capture/webhook
```

### Authentication

Set `CAPTURE_WEBHOOK_SECRET` in your `.env.local`:
```
CAPTURE_WEBHOOK_SECRET=your-secret-token-here
```

Then include it in requests:
```bash
curl -X POST https://your-domain.com/api/capture/webhook \
  -H "Authorization: Bearer your-secret-token-here" \
  -H "Content-Type: application/json" \
  -d '{"text": "Remember to call mom tomorrow"}'
```

### Request Format

```json
{
  "text": "The content to capture",
  "source": "email",
  "url": "https://article.com/link",
  "title": "Article Title"
}
```

Field names are flexible - these all work:
- `text`, `content`, `body`, or `message` for the main content
- `source` or `from` for the source identifier

---

## Option 1: Email Forwarding (Recommended)

### Using Zapier (Free tier available)

1. Create a Zap: **Email by Zapier → Webhook**
2. Set up Email trigger:
   - You'll get an email like `your-zap@robot.zapier.com`
3. Add Webhook action:
   - URL: `https://your-domain.com/api/capture/webhook`
   - Method: POST
   - Headers: `Authorization: Bearer YOUR_SECRET`
   - Body:
     ```json
     {
       "text": "{{body_plain}}",
       "subject": "{{subject}}",
       "source": "email",
       "from": "{{from_email}}"
     }
     ```

Now forward any email to your Zapier address and it goes to your brain!

### Using Cloudflare Email Workers (Free)

If you have a domain on Cloudflare:

1. Go to Cloudflare Dashboard → Email → Email Routing
2. Create a custom address (e.g., `brain@yourdomain.com`)
3. Route to a Worker:

```javascript
export default {
  async email(message, env) {
    const text = await message.text();
    
    await fetch('https://your-domain.com/api/capture/webhook', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.WEBHOOK_SECRET}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: text,
        subject: message.headers.get('subject'),
        source: 'email',
        from: message.from
      })
    });
  }
}
```

---

## Option 2: iOS Shortcuts

Create a shortcut to capture from Share Sheet:

1. Open Shortcuts app
2. Create new shortcut
3. Add actions:
   - **Receive** input from Share Sheet (URLs, Text, etc.)
   - **Get Contents of URL**:
     - URL: `https://your-domain.com/api/capture/webhook`
     - Method: POST
     - Headers: `Authorization: Bearer YOUR_SECRET`
     - Request Body: JSON
       ```json
       {
         "text": "[Shortcut Input]",
         "source": "ios-shortcut"
       }
       ```
4. Name it "Send to Brain"
5. Enable "Show in Share Sheet"

Now you can share any article, text, or link directly to your brain!

---

## Option 3: Browser Bookmarklet

Add this bookmarklet to capture the current page:

```javascript
javascript:(function(){
  const text = window.getSelection().toString() || document.title;
  const url = window.location.href;
  fetch('https://your-domain.com/api/capture/webhook', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_SECRET',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      text: text,
      url: url,
      title: document.title,
      source: 'bookmarklet'
    })
  }).then(() => alert('Captured!')).catch(() => alert('Failed'));
})();
```

1. Create a new bookmark
2. Paste the code as the URL
3. Click it on any page to capture

---

## Option 4: SMS via Twilio

1. Create Twilio account
2. Get a phone number
3. Set webhook URL to: `https://your-domain.com/api/capture/webhook`
4. Twilio will POST with `Body` containing the SMS text

---

## Option 5: IFTTT

1. Create IFTTT account
2. Create Applet:
   - **If**: Any trigger (email, SMS, voice, etc.)
   - **Then**: Webhooks → Make a web request
     - URL: `https://your-domain.com/api/capture/webhook`
     - Method: POST
     - Content-Type: application/json
     - Body: `{"text": "{{TextField}}", "source": "ifttt"}`

---

## Quick Test

### Test Webhook (Capture)

```bash
# Test locally
curl -X POST http://localhost:3000/api/capture/webhook \
  -H "Content-Type: application/json" \
  -d '{"text": "Test capture from curl", "source": "test"}'

# Test via Tailscale (replace with your IP)
curl -X POST http://100.x.y.z:3000/api/capture/webhook \
  -H "Content-Type: application/json" \
  -d '{"text": "Test from Tailscale", "source": "test"}'
```

### Check Webhook Status

```bash
curl http://localhost:3000/api/capture/webhook
```

### Test Today's Summary (for Siri)

```bash
# Plain text (for Siri)
curl http://localhost:3000/api/summary/today

# JSON format
curl "http://localhost:3000/api/summary/today?format=json"
```

### Test with Authentication (if enabled)

```bash
curl -X POST http://localhost:3000/api/capture/webhook \
  -H "Authorization: Bearer your-secret-token" \
  -H "Content-Type: application/json" \
  -d '{"text": "Authenticated capture", "source": "test"}'
```

---

## Security Tips

1. **Always use HTTPS** in production
2. **Set a strong secret** - use `openssl rand -hex 32`
3. **Rotate secrets** periodically
4. **Monitor the inbox** for unexpected captures
