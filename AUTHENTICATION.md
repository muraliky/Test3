# Secure Authentication Guide

## Overview

This toolkit uses **Auth State Persistence** - the most secure approach:

1. You log in **once** (manually or via script)
2. Session cookies are saved to `auth.json`
3. Tests and MCP reuse saved session
4. **Credentials are NEVER stored or exposed to MCP**

```
┌─────────────────────────────────────────────────────────────────┐
│  SECURE AUTH FLOW                                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  YOU                        auth.json                MCP/Tests  │
│   │                            │                         │      │
│   │  npm run auth:setup        │                         │      │
│   │  ───────────────────►      │                         │      │
│   │  (enter credentials)       │                         │      │
│   │                            │                         │      │
│   │  Login successful          │                         │      │
│   │  ───────────────────►      │                         │      │
│   │                        [cookies]                     │      │
│   │                        [session]                     │      │
│   │                            │                         │      │
│   │                            │   Load auth state       │      │
│   │                            │ ◄─────────────────────  │      │
│   │                            │                         │      │
│   │                            │   Already logged in!    │      │
│   │                            │ ─────────────────────►  │      │
│   │                                                      │      │
│   │            ❌ Credentials NEVER reach MCP            │      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Quick Start

### Option 1: Interactive Login (Recommended)

```bash
npm run auth:setup
```

This opens Desktop Chrome. You log in manually. Session is saved.

### Option 2: Headless Login (CI/Automation)

```bash
# Set credentials securely (use your org's secret management)
export AUTH_ENCRYPTION_KEY="your-32-char-encryption-key"
export TEST_USERNAME="your-username"
export TEST_PASSWORD="your-password"

npm run auth:setup:headless
```

Credentials are encrypted in memory, used once, then cleared.

---

## Commands

| Command | Description |
|---------|-------------|
| `npm run auth:setup` | Interactive login in browser |
| `npm run auth:setup:headless` | Headless login with env vars |
| `npm run auth:check` | Check if auth state exists/valid |
| `npm run auth:clear` | Delete saved auth state |

---

## Configuration

Edit `scripts/auth-setup.js` to match your login page:

```javascript
const CONFIG = {
  loginUrl: 'https://your-app.com/login',
  
  selectors: {
    usernameInput: '#username',      // Your username field
    passwordInput: '#password',      // Your password field
    loginButton: 'button[type="submit"]',
    loggedInIndicator: '.user-menu', // Element visible after login
  },
};
```

---

## Security Best Practices

### ✅ DO:
- Use `npm run auth:setup` (interactive) when possible
- Set `AUTH_ENCRYPTION_KEY` for headless mode
- Refresh auth state regularly
- Clear auth state when done: `npm run auth:clear`

### ❌ DON'T:
- Commit `auth.json` to git
- Commit `.env.encrypted` with real credentials
- Share auth state files
- Use hardcoded credentials

---

## What Gets Stored

### auth.json (Session State)
```json
{
  "cookies": [
    { "name": "session_id", "value": "abc123..." },
    { "name": "auth_token", "value": "xyz789..." }
  ],
  "origins": [
    { "localStorage": [...] }
  ]
}
```

**Contains:** Session cookies, localStorage, sessionStorage
**Does NOT contain:** Username, password, credentials

### .env.encrypted (Optional)
```json
{
  "username": "aes-256-encrypted-value",
  "password": "aes-256-encrypted-value"
}
```

Only created if you choose to save credentials for headless mode.
Encrypted with AES-256-CBC using `AUTH_ENCRYPTION_KEY`.

---

## MCP Security

When using `@pw-debug`:

1. MCP loads `auth.json` with `--storage-state` flag
2. Browser starts already logged in
3. MCP navigates, inspects, debugs
4. **MCP never sees or handles credentials**

```json
// VS Code settings.json
{
  "github.copilot.chat.mcpServers": {
    "playwright": {
      "args": ["@anthropic/playwright-mcp", "--storage-state", "./auth.json"]
    }
  }
}
```

---

## Troubleshooting

### "Session expired"
```bash
npm run auth:setup
```

### "Not logged in" during tests
```bash
npm run auth:check  # Check if auth.json exists
npm run auth:setup  # Refresh if needed
```

### "Auth state too old"
Auth state typically expires based on your app's session timeout.
Refresh before running tests:
```bash
npm run auth:setup
```

---

## CI/CD Integration

For CI pipelines, use environment variables:

```yaml
# GitHub Actions example
jobs:
  test:
    steps:
      - name: Setup Auth
        env:
          AUTH_ENCRYPTION_KEY: ${{ secrets.AUTH_ENCRYPTION_KEY }}
          TEST_USERNAME: ${{ secrets.TEST_USERNAME }}
          TEST_PASSWORD: ${{ secrets.TEST_PASSWORD }}
          LOGIN_URL: https://your-app.com/login
        run: npm run auth:setup:headless
      
      - name: Run Tests
        run: npm test
```

**Note:** Use your CI's secret management for credentials.
