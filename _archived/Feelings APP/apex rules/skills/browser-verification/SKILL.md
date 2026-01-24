---
name: browser-verification
description: >
  Verify UI changes and frontend behavior using browser automation.
  Distinguishes between functional testing (behavior) and visual testing
  (appearance). Use for acceptance criteria verification on UI tasks,
  E2E testing, and visual regression. Triggers on: verify in browser,
  browser test, UI verification, visual test, functional test, check UI.
license: Apache-2.0
compatibility: Claude Code, Cursor, VS Code, Amp
metadata:
  author: apex
  version: "1.0"
  updated: "2026-01"
  source: "Adapted from snarktank/ralph dev-browser patterns"
allowed-tools: Read Bash CallMcpTool
---

# Browser Verification — Complete Guide

## TL;DR

Two types of browser verification:

| Type | Purpose | Tool | Output |
|------|---------|------|--------|
| **Functional** | Does it work? | `take_snapshot` | A11y tree (text) |
| **Visual** | Does it look right? | `take_screenshot` | Image |

**Key Rule**: Use `take_snapshot` for behavior verification (agents can read text). Use `take_screenshot` only for visual appearance checks.

---

## 1. WHEN TO USE EACH

### Functional Testing (take_snapshot)

**Use for**: Verifying that UI elements exist and behave correctly.

| Verification Need | Use Snapshot |
|-------------------|--------------|
| Button exists | ✅ |
| Text appears correctly | ✅ |
| Form submission works | ✅ |
| Navigation functions | ✅ |
| Error messages display | ✅ |
| List items render | ✅ |
| Interactive elements respond | ✅ |

**Why**: `take_snapshot` returns the accessibility tree as text, which agents can read and verify programmatically.

### Visual Testing (take_screenshot)

**Use for**: Verifying appearance, layout, and styling.

| Verification Need | Use Screenshot |
|-------------------|----------------|
| Colors are correct | ✅ |
| Layout looks right | ✅ |
| Spacing/alignment | ✅ |
| Responsive design | ✅ |
| Animations work | ✅ |
| Visual regressions | ✅ |

**Why**: Visual appearance requires actually seeing the rendered output.

---

## 2. FUNCTIONAL TESTING GUIDE

### Using take_snapshot

The snapshot returns an accessibility tree with interactive elements and their refs:

```bash
# Using agent-browser MCP
agent-browser snapshot -i
```

**Example Output**:

```
[1] button "Submit Form"
[2] input "Email" value=""
[3] link "Sign Up"
[4] heading "Welcome to the App"
[5] button "Cancel"
[6] list "Navigation"
  [7] listitem "Home"
  [8] listitem "Settings"
```

### Verification Patterns

#### Check Element Exists

```bash
# Verify button exists
agent-browser snapshot -i | grep -i "submit"

# Expected: [1] button "Submit Form"
```

#### Check Text Content

```bash
# Verify heading text
agent-browser snapshot -i | grep -i "welcome"

# Expected: [4] heading "Welcome to the App"
```

#### Check Form State

```bash
# Verify input field
agent-browser snapshot -i | grep -i "email"

# Expected: [2] input "Email" value="user@example.com"
```

#### Interact and Verify

```bash
# Click a button
agent-browser click 1

# Take snapshot after interaction
agent-browser snapshot -i | grep -i "success"

# Expected: Some success message element
```

### Acceptance Criteria Format

For functional verification in PRDs:

```markdown
**Acceptance Criteria**:
- [ ] Submit button is visible and clickable
- [ ] Error message appears for invalid email
- [ ] Success message shows after form submission
- [ ] Navigation links work correctly
- [ ] Use browser-verification skill with take_snapshot to verify
```

---

## 3. VISUAL TESTING GUIDE

### Using take_screenshot

Capture the rendered page as an image:

```bash
# Save screenshot to file
agent-browser screenshot tmp/result.png

# Or capture specific viewport
agent-browser screenshot tmp/mobile.png --viewport 375x667
```

### When Visual Testing is Required

Add visual testing criteria when:

1. **New UI Components**: First implementation of a design
2. **Styling Changes**: CSS modifications, theme updates
3. **Responsive Design**: Different viewport sizes
4. **Design System Compliance**: Must match mockups

### Acceptance Criteria Format

For visual verification in PRDs:

```markdown
**Acceptance Criteria**:
- [ ] Button styling matches design (blue background, white text)
- [ ] Layout is centered on desktop, full-width on mobile
- [ ] Hover state shows darker blue
- [ ] Use browser-verification skill with take_screenshot to verify appearance
```

### Viewport Testing

Test responsive designs at multiple viewports:

```bash
# Desktop
agent-browser screenshot tmp/desktop.png --viewport 1920x1080

# Tablet
agent-browser screenshot tmp/tablet.png --viewport 768x1024

# Mobile
agent-browser screenshot tmp/mobile.png --viewport 375x667
```

---

## 4. INTEGRATION WITH MCP

### Playwright MCP Server

The most common browser automation MCP:

```python
# MCP server configuration
mcp_servers = {
    "playwright": {
        "command": "npx",
        "args": ["@playwright/mcp@latest"]
    }
}
```

### Common MCP Tools

| Tool | Purpose | Returns |
|------|---------|---------|
| `navigate` | Go to URL | Success/failure |
| `click` | Click element | Success/failure |
| `type` | Enter text | Success/failure |
| `snapshot` | Get a11y tree | Text tree |
| `screenshot` | Capture image | Image path |
| `evaluate` | Run JS | Result |

### Example Workflow

```bash
# 1. Navigate to page
agent-browser navigate http://localhost:3000/login

# 2. Take initial snapshot
agent-browser snapshot -i

# 3. Fill form
agent-browser type 2 "user@example.com"  # [2] is email input
agent-browser type 3 "password123"        # [3] is password input

# 4. Click submit
agent-browser click 1                      # [1] is submit button

# 5. Verify result
agent-browser snapshot -i | grep -i "dashboard"
```

---

## 5. VERIFICATION CHECKLIST

### Before Browser Testing

```
□ Dev server is running (npm run dev / etc)
□ Database has test data (if needed)
□ User is logged in (if testing authenticated pages)
□ Browser MCP server is configured
```

### Functional Test Checklist

```
□ Navigate to correct page
□ Take snapshot to see current state
□ Identify elements by ref numbers
□ Perform interactions (click, type)
□ Take snapshot after each interaction
□ Verify expected elements appear
□ Check for error states too
```

### Visual Test Checklist

```
□ Test at multiple viewport sizes
□ Check light and dark mode (if applicable)
□ Verify hover/focus states
□ Compare to design mockups
□ Check for layout shifts
```

---

## 6. COMMON PATTERNS

### Pattern 1: Form Submission

```bash
# Navigate
agent-browser navigate http://localhost:3000/contact

# Get initial state
agent-browser snapshot -i
# Output shows: [1] input "Name", [2] input "Email", [3] button "Send"

# Fill form
agent-browser type 1 "John Doe"
agent-browser type 2 "john@example.com"

# Submit
agent-browser click 3

# Verify success
agent-browser snapshot -i | grep -i "thank you"
# Should show success message
```

### Pattern 2: Navigation

```bash
# Start at home
agent-browser navigate http://localhost:3000

# Get nav elements
agent-browser snapshot -i
# Output shows: [5] link "Settings"

# Navigate
agent-browser click 5

# Verify new page
agent-browser snapshot -i | grep -i "settings"
# Should show settings page elements
```

### Pattern 3: Error Handling

```bash
# Navigate to form
agent-browser navigate http://localhost:3000/signup

# Submit empty form (to trigger validation)
agent-browser snapshot -i
# [3] button "Sign Up"

agent-browser click 3

# Verify error messages appear
agent-browser snapshot -i | grep -i "required"
# Should show: "Email is required", "Password is required", etc.
```

### Pattern 4: Conditional Rendering

```bash
# Check element appears after action
agent-browser navigate http://localhost:3000/dashboard

# Initial state (no modal)
agent-browser snapshot -i
# No modal visible

# Click to open modal
agent-browser click 2  # "Open Settings" button

# Verify modal appears
agent-browser snapshot -i | grep -i "modal\|dialog"
# Should show modal elements
```

### Pattern 5: List Verification

```bash
# Navigate to list page
agent-browser navigate http://localhost:3000/tasks

# Get list items
agent-browser snapshot -i
# Output shows:
# [10] list "Tasks"
#   [11] listitem "Task 1"
#   [12] listitem "Task 2"
#   [13] listitem "Task 3"

# Verify count
agent-browser snapshot -i | grep -c "listitem"
# Should match expected count
```

---

## 7. WRITING ACCEPTANCE CRITERIA

### Good UI Acceptance Criteria

Include specific, verifiable browser checks:

```markdown
### US-003: Add task form

**Acceptance Criteria**:
- [ ] "Add Task" button appears on task list page
- [ ] Clicking button opens form modal
- [ ] Form has fields: title (required), description (optional), priority dropdown
- [ ] Submit with empty title shows "Title is required" error
- [ ] Submit with valid data adds task to list
- [ ] Modal closes after successful submit
- [ ] npm run typecheck passes
- [ ] Verify with browser-verification skill:
  - Functional: take_snapshot to verify form elements and submission
  - Visual: take_screenshot to verify modal styling
```

### Bad UI Acceptance Criteria

Avoid vague criteria:

```markdown
- [ ] Form works correctly  ❌ (not specific)
- [ ] Good UX  ❌ (subjective)
- [ ] Looks nice  ❌ (not verifiable)
```

---

## 8. DEBUGGING TIPS

### Element Not Found

```bash
# If grep finds nothing, get full snapshot
agent-browser snapshot -i

# Look for similar elements
agent-browser snapshot -i | grep -i "button"

# Element might have different text/role
```

### Interaction Fails

```bash
# Verify element is interactive
agent-browser snapshot -i
# Check if element has ref number (interactive elements do)

# Wait for page load
sleep 2 && agent-browser snapshot -i

# Check for overlays blocking clicks
agent-browser snapshot -i | grep -i "modal\|overlay"
```

### Page Not Loading

```bash
# Verify dev server is running
curl http://localhost:3000

# Check for JS errors
agent-browser evaluate "console.log('test')"

# Try refreshing
agent-browser navigate http://localhost:3000
```

---

## 9. QUICK REFERENCE

### Commands

| Command | Purpose |
|---------|---------|
| `agent-browser navigate [url]` | Go to page |
| `agent-browser snapshot -i` | Get a11y tree |
| `agent-browser screenshot [path]` | Save image |
| `agent-browser click [ref]` | Click element |
| `agent-browser type [ref] [text]` | Enter text |
| `agent-browser evaluate [js]` | Run JavaScript |

### Verification Decision Tree

```
Need to verify UI?
├── Checking behavior/functionality?
│   └── Use take_snapshot
│       ├── grep for expected text
│       └── Verify elements exist
│
└── Checking appearance/styling?
    └── Use take_screenshot
        ├── Save to tmp/
        └── Compare visually
```

### Acceptance Criteria Templates

**For functional verification:**
```markdown
- [ ] [Element] appears on [page]
- [ ] Clicking [element] causes [behavior]
- [ ] Form shows error "[message]" when [condition]
- [ ] Verify with take_snapshot
```

**For visual verification:**
```markdown
- [ ] [Component] matches design mockup
- [ ] Layout is correct at [viewport size]
- [ ] Verify with take_screenshot
```

---

*APEX Browser Verification v1.0 — Functional and visual UI testing patterns*
