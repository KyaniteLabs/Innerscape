# iOS Shortcuts Guide

Complete step-by-step instructions for setting up iOS Shortcuts to interact with your Second Brain.

## Prerequisites

1. **Tailscale installed and connected** on both your Mac and iPhone
2. **Your Tailscale IP** - run `tailscale ip -4` on your Mac
3. **Second Brain running** - `npm run dev` on your Mac

## Available Shortcuts

| Shortcut | What it does | Trigger |
|----------|--------------|---------|
| Capture to Brain | Send anything via Share Sheet | Share button |
| Brain Capture | Voice dictation capture | "Hey Siri, Brain Capture" |
| Add Task | Add task with due date | "Hey Siri, Add Task" |
| Due Today | Check today's summary | "Hey Siri, Due Today" |

---

## Shortcut 1: Capture to Brain (Share Sheet)

Share any article, text, URL, or note directly to your Second Brain.

### Step-by-Step Instructions

1. Open the **Shortcuts** app on your iPhone
2. Tap **+** in the top right corner
3. Tap the name at top, rename to **"Capture to Brain"**

4. **Add URL action:**
   - Tap **Add Action**
   - Search for **"URL"** and tap it
   - Replace `apple.com` with your webhook URL:
     ```
     http://YOUR_TAILSCALE_IP:3000/api/capture/webhook
     ```
     (Replace `YOUR_TAILSCALE_IP` with your actual IP, e.g., `100.64.123.45`)

5. **Add HTTP request:**
   - Tap **Add Action**
   - Search for **"Get Contents of URL"** and tap it
   - Tap **"GET"** and change to **"POST"**

6. **Configure headers:**
   - Tap **"Headers"**
   - Tap **"Add new header"**
   - Key: `Content-Type`
   - Value: `application/json`

7. **Configure body:**
   - Tap **"Request Body"**
   - Change from "File" to **"JSON"**
   - Tap **"Add new field"**
     - Key: `text`
     - Type: Text
     - Tap the value field, then tap **"Select Variable"**
     - Choose **"Shortcut Input"**
   - Tap **"Add new field"** again
     - Key: `source`
     - Type: Text
     - Value: `ios-share`

8. **Add notification:**
   - Tap **Add Action**
   - Search for **"Show Notification"**
   - Title: `Captured!`
   - Body: `Sent to Second Brain`

9. **Enable Share Sheet:**
   - Tap the **ⓘ** icon at the bottom of the screen
   - Toggle ON **"Show in Share Sheet"**
   - Tap **"Receive"** and select:
     - Text
     - URLs
     - Safari web pages
     - Articles
     - (any other types you want)

10. Tap **Done**

### How to Use

From any app (Safari, Notes, Mail, etc.):
1. Tap the **Share** button
2. Scroll down and tap **"Capture to Brain"**
3. You'll see a "Captured!" notification

---

## Shortcut 2: Brain Capture (Voice)

Speak your thoughts and they get captured automatically.

### Step-by-Step Instructions

1. Open **Shortcuts** app
2. Tap **+** to create new shortcut
3. Rename to **"Brain Capture"**

4. **Add dictation:**
   - Tap **Add Action**
   - Search for **"Dictate Text"** and tap it
   - Language: English (or your preference)
   - Stop Listening: **After Pause**

5. **Add URL action:**
   - Tap **Add Action**
   - Search for **"URL"**
   - Enter: `http://YOUR_TAILSCALE_IP:3000/api/capture/webhook`

6. **Add HTTP request:**
   - Tap **Add Action**
   - Search for **"Get Contents of URL"**
   - Method: **POST**
   - Headers: Add `Content-Type` = `application/json`
   - Request Body: **JSON**
     - Add field: `text` = (select variable **"Dictated Text"**)
     - Add field: `source` = `siri-voice`

7. **Add notification:**
   - Tap **Add Action**
   - Search for **"Show Notification"**
   - Title: `Captured!`
   - Body: (select variable **"Dictated Text"**)

8. Tap **Done**

### How to Use

Say: **"Hey Siri, Brain Capture"**

Then speak your thought. It will be:
1. Transcribed to text
2. Sent to your Second Brain
3. Processed by the AI agent

---

## Shortcut 3: Add Task

Add a task with a due date using prompts.

### Step-by-Step Instructions

1. Create new shortcut named **"Add Task"**

2. **Ask for task name:**
   - Add Action: **"Ask for Input"**
   - Prompt: `What's the task?`
   - Input Type: Text

3. **Save to variable:**
   - Add Action: **"Set Variable"**
   - Variable Name: `taskText`
   - Input: (Provided Input)

4. **Ask for due date:**
   - Add Action: **"Ask for Input"**
   - Prompt: `When is it due? (e.g., tomorrow, Friday, Jan 30)`
   - Input Type: Text

5. **Build the message:**
   - Add Action: **"Text"**
   - Content: `[Task due: ` then tap and insert **"Provided Input"** then `] ` then tap and insert **"taskText"**
   - Result looks like: `[Task due: tomorrow] Buy groceries`

6. **Add URL and HTTP request** (same as above):
   - URL: `http://YOUR_TAILSCALE_IP:3000/api/capture/webhook`
   - Method: POST
   - Body JSON:
     - `text` = (select the **Text** variable from step 5)
     - `source` = `ios-task`

7. **Add notification:**
   - Title: `Task Added!`
   - Body: (select **taskText** variable)

8. Tap **Done**

### How to Use

Say: **"Hey Siri, Add Task"**

You'll be prompted for:
1. The task name
2. The due date

---

## Shortcut 4: Due Today

Get a summary of what's due today and your recent activity.

### Step-by-Step Instructions

1. Create new shortcut named **"Due Today"**

2. **Add URL:**
   - Add Action: **"URL"**
   - Enter: `http://YOUR_TAILSCALE_IP:3000/api/summary/today`

3. **Get the content:**
   - Add Action: **"Get Contents of URL"**
   - Method: **GET** (default)

4. **Speak the result (optional):**
   - Add Action: **"Speak Text"**
   - Text: (select **"Contents of URL"**)

5. **Or show as alert:**
   - Add Action: **"Show Result"**
   - Text: (select **"Contents of URL"**)

6. Tap **Done**

### How to Use

Say: **"Hey Siri, Due Today"**

Siri will read or display your summary including:
- Tasks due today
- Pending tasks
- Active projects
- Today's captures
- Recent ideas

---

## Adding Shortcuts to Home Screen

For quick access without Siri:

1. In Shortcuts app, long-press any shortcut
2. Tap **"Add to Home Screen"**
3. Optionally customize the icon
4. Tap **Add**

---

## Troubleshooting

### "Could not connect to the server"

1. Check Tailscale is connected on your phone (green dot in Tailscale app)
2. Verify your Mac is running Tailscale (`tailscale status`)
3. Make sure the dev server is running (`npm run dev`)
4. Double-check the IP address (`tailscale ip -4`)

### "No response" or timeout

The capture might still work! Check your Second Brain dashboard.

### Shortcut doesn't appear in Share Sheet

1. Open the shortcut settings (ⓘ icon)
2. Ensure "Show in Share Sheet" is ON
3. Check the "Receive" types include what you're sharing

### Test from Terminal First

Before creating shortcuts, test your setup:

```bash
# On your Mac
curl -X POST http://localhost:3000/api/capture/webhook \
  -H "Content-Type: application/json" \
  -d '{"text": "Test from Mac", "source": "test"}'

# Should return: {"success":true,"id":"...","message":"Captured successfully"...}
```

---

## Quick Reference

Replace `YOUR_TAILSCALE_IP` with your actual IP (e.g., `100.64.123.45`).

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/capture/webhook` | POST | Capture content |
| `/api/summary/today` | GET | Get today's summary (plain text) |
| `/api/summary/today?format=json` | GET | Get today's summary (JSON) |
| `/api/tasks` | GET | List all tasks |
| `/api/projects` | GET | List all projects |

---

## Sharing Your Shortcuts

Once you've created a shortcut, you can share it:

1. Long-press the shortcut
2. Tap **Share**
3. Choose **Copy iCloud Link**

You can then share this link with others (they'll need to update the IP address).

---

## Note on Shortcut Files

iOS Shortcuts are stored as binary files that can only be created on an iOS device. This guide provides complete step-by-step instructions to create each shortcut manually. 

Once you create a shortcut, you can generate an iCloud link to share it with others or back it up.

---

## Summary

After following this guide, you'll have:

| Shortcut | Trigger | What it does |
|----------|---------|--------------|
| **Capture to Brain** | Share Sheet | Send articles, links, text |
| **Brain Capture** | "Hey Siri, Brain Capture" | Voice capture |
| **Add Task** | "Hey Siri, Add Task" | Task with due date |
| **Due Today** | "Hey Siri, Due Today" | Spoken summary |

All data is sent securely through your Tailscale network - no public internet exposure.
