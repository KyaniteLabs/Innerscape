# Mac Quick Access Setup

Make NeuroSecond always accessible from your Mac with Dock icons and global keyboard shortcuts.

## Prerequisites

- macOS 14+ (Sonoma) for best PWA support
- Safari as your primary browser (for PWA features)
- NeuroSecond running locally or deployed

---

## Option 1: Add to Dock (Recommended)

Safari can add web apps to your Dock as standalone apps.

### Steps

1. Open NeuroSecond in **Safari**
2. Click **File** menu
3. Select **Add to Dock...**
4. Name it "NeuroSecond" or "Brain"
5. Click **Add**

The app now appears in your Dock with its icon. Clicking it opens NeuroSecond in a dedicated window (no browser chrome).

---

## Option 2: Global Keyboard Shortcut

Open NeuroSecond from anywhere with a keyboard shortcut.

### Using Automator

1. Open **Automator** (search in Spotlight)
2. Create new **Quick Action**
3. Set "Workflow receives" to **no input**
4. Add action: **Run Shell Script**
5. Paste this script:
   ```bash
   open "https://your-domain.com/voice"
   ```
   (or `http://localhost:3000/voice` for local dev)

6. Save as **"Capture Thought"**

### Assign Keyboard Shortcut

1. Open **System Settings** (or System Preferences)
2. Go to **Keyboard** > **Keyboard Shortcuts**
3. Select **Services** (or **App Shortcuts**)
4. Find **Capture Thought** under General
5. Click "Add Shortcut"
6. Press your desired keys (e.g., `⌘⇧C`)

### Usage

Press `⌘⇧C` (or your chosen shortcut) from anywhere to open voice capture!

---

## Option 3: Raycast Extension

If you use Raycast:

1. Open Raycast
2. Search for "Create Quicklink"
3. Name: **Capture Thought**
4. Link: `https://your-domain.com/voice`
5. Assign hotkey in Raycast preferences

---

## Option 4: Alfred Workflow

If you use Alfred:

1. Open Alfred Preferences
2. Go to **Workflows**
3. Create new **Blank Workflow**
4. Add **Hotkey** trigger
5. Connect to **Open URL** action
6. URL: `https://your-domain.com/voice`

---

## Voice-First Tips for Mac

### Direct Voice Mode

Add `?voice=true` to any NeuroSecond URL to auto-start recording:
- `http://localhost:3000/?voice=true`
- `https://your-domain.com/?voice=true`

Or use the dedicated voice page:
- `http://localhost:3000/voice`

### macOS Dictation

For super-fast capture without opening the app:

1. Enable macOS Dictation (System Settings > Keyboard > Dictation)
2. Double-press the Function key to start dictating
3. Dictate your thought
4. Copy the text
5. Use Alfred/Raycast to send to API

---

## Menu Bar Integration (Advanced)

For a persistent menu bar icon, you can use these tools:

### Nativefier (Create Desktop App)

```bash
npx nativefier "https://your-domain.com" --name "NeuroSecond" --tray
```

### BitBar/SwiftBar

Create a menu bar script that shows recent captures or quick-capture button.

---

## Quick Reference

| Action | Method |
|--------|--------|
| Open full app | Click Dock icon |
| Voice capture | `⌘⇧C` (after setup) |
| Voice via URL | `open "http://localhost:3000/voice"` |
| Auto-voice on main page | Add `?voice=true` to URL |

---

## Troubleshooting

### Dock icon opens in browser instead of app

- Make sure you used Safari's "Add to Dock" feature
- Chrome/Firefox don't create true PWA apps on Mac

### Keyboard shortcut not working

1. Check System Settings > Keyboard > Keyboard Shortcuts
2. Make sure no other app is using the same shortcut
3. Try logging out and back in

### Voice not auto-starting

- Check browser microphone permissions
- Make sure the page fully loaded before expecting auto-start

---

## Development Setup

For local development, add to your shell profile (`.zshrc` or `.bashrc`):

```bash
# Quick capture to local NeuroSecond
alias brain="open http://localhost:3000/voice"

# Or with curl for direct API capture
capture() {
    curl -s -X POST http://localhost:3000/api/capture \
        -H "Content-Type: application/json" \
        -d "{\"text\": \"$*\", \"source\": \"terminal\"}"
    echo "Captured!"
}
```

Usage:
```bash
brain           # Opens voice capture
capture "My brilliant idea"  # Direct API capture
```
