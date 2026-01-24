# iOS Siri Shortcut Setup

Capture thoughts to NeuroSecond using "Hey Siri" from anywhere on your iPhone.

## Prerequisites

1. NeuroSecond deployed to a public URL (e.g., Vercel)
2. Your API endpoint: `https://your-domain.com/api/capture`
3. iOS 15+ on your iPhone

---

## Option 1: Voice Capture via Web (Recommended)

This opens the NeuroSecond voice page for in-app transcription.

### Create the Shortcut

1. Open **Shortcuts** app on iPhone
2. Tap **+** to create new shortcut
3. Add action: **Open URL**
4. Enter URL: `https://your-domain.com/voice`
5. Tap the shortcut name at top, rename to **"Capture Thought"**
6. Tap **Done**

### Add to Siri

1. Tap the **...** on your shortcut
2. Tap **Add to Siri**
3. Record a phrase like **"Capture thought"** or **"Brain dump"**
4. Tap **Done**

### Usage

- Say: **"Hey Siri, Capture thought"**
- NeuroSecond opens in voice mode
- Speak your thought
- Tap the mic button when done

---

## Option 2: Direct API Capture (Fastest)

This uses Siri's built-in dictation and sends directly to the API.

### Create the Shortcut

1. Open **Shortcuts** app
2. Tap **+** to create new shortcut

#### Step 1: Dictation

3. Add action: **Dictate Text**
   - Tap "Stop Listening": **After Pause**
   - Language: Your language

#### Step 2: Send to API

4. Add action: **Get Contents of URL**
5. Configure:
   - URL: `https://your-domain.com/api/capture`
   - Method: **POST**
   - Headers:
     - `Content-Type`: `application/json`
   - Request Body: **JSON**
     - Add field: `text` = **Dictated Text** (tap to select variable)
     - Add field: `source` = `siri`

#### Step 3: Confirmation

6. Add action: **Show Notification**
   - Title: `Captured!`
   - Body: **Dictated Text**

7. Rename shortcut to **"Quick Capture"**
8. Tap **Done**

### Add to Siri

1. Tap **...** on your shortcut
2. Tap **Add to Siri**
3. Record phrase: **"Quick capture"**

### Usage

- Say: **"Hey Siri, Quick capture"**
- Wait for "What would you like to say?"
- Speak your thought
- Siri sends it directly to NeuroSecond
- You get a notification when captured

---

## Option 3: Widget for Home Screen

Add a one-tap widget for instant capture.

1. Create either shortcut above
2. Long press on iPhone home screen
3. Tap **+** (top left)
4. Search for **Shortcuts**
5. Add the **Shortcuts** widget
6. Tap widget to configure
7. Select your **Capture Thought** shortcut

Now you have a one-tap capture button on your home screen!

---

## Troubleshooting

### "Couldn't connect to server"

- Check your NeuroSecond URL is correct
- Ensure the app is deployed and accessible
- Try opening the URL in Safari first

### "Request timed out"

- Your server might be cold starting (Vercel free tier)
- Try again in a few seconds

### Dictation not working

- Go to Settings > Privacy > Speech Recognition
- Ensure it's enabled for Shortcuts

### Shortcut not appearing in Siri

- Go to Settings > Siri & Search
- Find your shortcut and enable it

---

## Security Note

The API endpoint is open by default. For added security:

1. Add an API key to your `.env.local`:
   ```
   CAPTURE_API_KEY=your-secret-key-here
   ```

2. In your shortcut, add a header:
   - Key: `x-api-key`
   - Value: `your-secret-key-here`

---

## Advanced: Apple Watch

The same shortcuts work on Apple Watch!

1. On your iPhone, open **Watch** app
2. Go to **Shortcuts**
3. Enable your capture shortcut
4. Use Siri on your watch: "Hey Siri, Quick capture"

---

## Quick Reference

| Phrase | Action |
|--------|--------|
| "Hey Siri, Capture thought" | Opens voice page |
| "Hey Siri, Quick capture" | Direct dictation → API |
| Home screen widget tap | Opens voice page |
| Apple Watch "Quick capture" | Direct dictation → API |

---

## Example Shortcut JSON

For advanced users, here's the shortcut structure:

```json
{
  "WFWorkflowActions": [
    {
      "WFWorkflowActionIdentifier": "is.workflow.actions.dictatetext",
      "WFWorkflowActionParameters": {
        "WFDictateTextStopListening": "After Pause"
      }
    },
    {
      "WFWorkflowActionIdentifier": "is.workflow.actions.downloadurl",
      "WFWorkflowActionParameters": {
        "WFHTTPMethod": "POST",
        "WFHTTPHeaders": {
          "Content-Type": "application/json"
        },
        "WFHTTPBodyType": "Json",
        "WFJSONValues": {
          "text": {"WFSerializationType": "WFTextTokenString"},
          "source": "siri"
        },
        "WFURL": "https://your-domain.com/api/capture"
      }
    },
    {
      "WFWorkflowActionIdentifier": "is.workflow.actions.notification",
      "WFWorkflowActionParameters": {
        "WFNotificationActionTitle": "Captured!"
      }
    }
  ]
}
```
