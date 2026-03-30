# Selenium → Playwright Migration Toolkit

Migrate Selenium + Java + QAF + Cucumber to Playwright + TypeScript + playwright-bdd.

## Features

- **Phase 1: Migration** - Convert Java to TypeScript with AI assistance
- **Phase 2: Execution & Fixing** - Run tests on Desktop Chrome, fix failures with Playwright MCP
- **Desktop Chrome** - Uses installed Chrome, not bundled Playwright browsers
- **Playwright MCP** - AI-powered debugging via VS Code GitHub Copilot
- **Secure Auth** - Credentials encrypted, MCP never sees them

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 1: MIGRATION                                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  @pw-orchestrator start                                         │
│        │                                                        │
│        ├── Generate skeletons (node scripts/migrate.js)         │
│        ├── Convert each file (one by one, method by method)     │
│        └── Run verification                                     │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  PHASE 2: EXECUTION & FIXING                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  npm run auth:setup  (login once, save session)                 │
│        │                                                        │
│        ▼                                                        │
│  auth.json (cookies/session - NO credentials)                   │
│        │                                                        │
│        ├──────────────────┬─────────────────────┐               │
│        ▼                  ▼                     ▼               │
│  @pw-test           Playwright MCP        All Tests             │
│  (uses auth.json)   (uses auth.json)     (use auth.json)        │
│        │                  │                                     │
│        │            ❌ Never sees                               │
│        │               credentials                              │
│        │                                                        │
│        ▼                                                        │
│  Desktop Chrome (already logged in)                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Quick Start

### Phase 1: Migration

```bash
# 1. Setup
./setup.sh

# 2. Add Java files
cp -r /your/project/pages/*.java _source-java/pages/
cp -r /your/project/steps/*.java _source-java/steps/
cp -r /your/project/features/*.feature _source-java/features/

# 3. Run migration (in VS Code with Copilot)
@pw-orchestrator start
```

### Phase 2: Execution & Fixing

```bash
# 1. Setup authentication (REQUIRED - do this first!)
npm run auth:setup
# Opens browser → you log in manually → session saved

# 2. Setup Playwright MCP (see docs/PLAYWRIGHT_MCP_SETUP.md)

# 3. Run tests
@pw-test

# 4. Fix failures (uses Playwright MCP)
@pw-debug
```

---

## Secure Authentication

**Your credentials are NEVER exposed to MCP or stored in plain text.**

```bash
# Interactive login (recommended)
npm run auth:setup

# Check auth status
npm run auth:check

# Clear auth when done
npm run auth:clear
```

See `docs/AUTHENTICATION.md` for full details.

### How It Works

1. **You run:** `npm run auth:setup`
2. **Browser opens:** You log in manually
3. **Session saved:** Cookies/tokens saved to `auth.json`
4. **Tests run:** Use saved session (already logged in)
5. **MCP debugs:** Uses saved session (never sees credentials)

---

## Agents

| Agent | Phase | Purpose |
|-------|-------|---------|
| `@pw-orchestrator` | 1 | Migration - converts files one by one |
| `@pw-migrate` | 1 | Re-convert single file |
| `@pw-verify` | 1 | Run CoVe verification |
| `@pw-test` | 2 | Run tests on Desktop Chrome |
| `@pw-debug` | 2 | Fix failures using Playwright MCP |

---

## Configuration

### Login Page Settings

Edit `scripts/auth-setup.js`:

```javascript
const CONFIG = {
  loginUrl: 'https://your-app.com/login',
  selectors: {
    usernameInput: '#username',
    passwordInput: '#password',
    loginButton: 'button[type="submit"]',
    loggedInIndicator: '.user-menu',
  },
};
```

### Playwright MCP (VS Code)

```json
{
  "github.copilot.chat.mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@anthropic/playwright-mcp", "--storage-state", "./auth.json"],
      "env": { "PLAYWRIGHT_BROWSER": "chrome" }
    }
  }
}
```

---

## Directory Structure

```
├── _source-java/           # INPUT: Java files
├── src/pages/              # OUTPUT: TypeScript pages
├── src/steps/              # OUTPUT: TypeScript steps
├── features/               # Feature files
├── auth.json               # Saved auth state (gitignored)
├── docs/
│   ├── AUTHENTICATION.md
│   └── PLAYWRIGHT_MCP_SETUP.md
├── copilot-agents/
│   ├── pw-orchestrator.agent.md
│   ├── pw-migrate.agent.md
│   ├── pw-verify.agent.md
│   ├── pw-test.agent.md
│   └── pw-debug.agent.md
├── scripts/
│   ├── migrate.js
│   ├── verify.js
│   └── auth-setup.js
└── playwright.config.ts
```

---

## Requirements

- Node.js 18+
- VS Code with GitHub Copilot
- Desktop Chrome installed
- Playwright MCP Server (for debugging)
