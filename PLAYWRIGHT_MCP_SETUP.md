# Playwright MCP Server Setup for VS Code GitHub Copilot

## Overview

Playwright MCP Server allows GitHub Copilot agents to interact with Desktop Chrome for:
- Debugging failed tests
- Finding correct locators
- Inspecting page elements
- Taking screenshots

**SECURITY:** MCP uses saved auth state (cookies/session) from `auth.json`. It never sees your credentials.

## Security Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  SECURE AUTH FLOW                                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. You run: npm run auth:setup                                 │
│     └── Opens browser, you log in manually                      │
│     └── Saves cookies/session to auth.json                      │
│     └── Credentials NEVER stored                                │
│                                                                 │
│  2. Tests run: npm test                                         │
│     └── Uses auth.json (already logged in)                      │
│     └── No credentials needed                                   │
│                                                                 │
│  3. MCP debugging: @pw-debug                                    │
│     └── Uses auth.json (already logged in)                      │
│     └── MCP NEVER sees credentials                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Setup Instructions

### Step 1: Setup Authentication First

```bash
# Interactive login (recommended)
npm run auth:setup

# This opens browser, you log in manually
# Auth state (cookies) saved to auth.json
```

### Step 2: Install Playwright MCP Server

```bash
npm install -g @anthropic/playwright-mcp
```

### Step 3: Configure VS Code

Add to your VS Code `settings.json`:

```json
{
  "github.copilot.chat.mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@anthropic/playwright-mcp", "--storage-state", "./auth.json"],
      "env": {
        "PLAYWRIGHT_BROWSER": "chrome",
        "PLAYWRIGHT_HEADLESS": "false"
      }
    }
  }
}
```

**Note:** The `--storage-state ./auth.json` flag tells MCP to use your saved auth state.

### Step 4: Alternative - Global MCP Config

Create/edit `~/.config/github-copilot/mcp.json`:

```json
{
  "servers": {
    "playwright": {
      "command": "npx",
      "args": ["@anthropic/playwright-mcp", "--storage-state", "./auth.json"],
      "env": {
        "PLAYWRIGHT_BROWSER": "chrome",
        "PLAYWRIGHT_HEADLESS": "false"
      }
    }
  }
}
```

### Step 5: Verify Setup

In VS Code Copilot Chat:
```
@playwright What tools are available?
```

---

## Auth Commands

| Command | Description |
|---------|-------------|
| `npm run auth:setup` | Interactive login (opens browser) |
| `npm run auth:setup:headless` | Headless login (uses env vars) |
| `npm run auth:check` | Check if auth state exists |
| `npm run auth:clear` | Clear saved auth state |

---

## Available MCP Tools

| Tool | Description |
|------|-------------|
| `browser_navigate` | Navigate to a URL (uses saved auth) |
| `browser_click` | Click an element |
| `browser_type` | Type text into an input |
| `browser_snapshot` | Take accessibility snapshot |
| `browser_screenshot` | Take visual screenshot |
| `browser_get_text` | Get text content |
| `browser_hover` | Hover over element |
| `browser_select` | Select dropdown option |
| `browser_close` | Close browser |

---

## Credential Security

### What IS stored (auth.json):
- Session cookies
- localStorage data
- Session tokens

### What is NOT stored:
- Username
- Password
- Any credentials

### Best Practices:
1. Add `auth.json` to `.gitignore`
2. Refresh auth state periodically (`npm run auth:setup`)
3. Clear auth state when done (`npm run auth:clear`)
4. Never commit `.env.encrypted` with real credentials

---

## Troubleshooting

### "Not logged in" errors
```bash
# Refresh auth state
npm run auth:setup
```

### "Auth state expired"
```bash
# Check age
npm run auth:check

# Refresh if needed
npm run auth:setup
```

### "Chrome not found"
Ensure Desktop Chrome is installed and in PATH.
