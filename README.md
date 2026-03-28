# Selenium → Playwright Migration Toolkit

Migrate Selenium + Java + QAF + Cucumber to Playwright + TypeScript + playwright-bdd.

## Architecture

**Single-agent with helpers** - One main agent does everything, helpers for manual fixes.

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   @pw-orchestrator (does EVERYTHING)                            │
│         │                                                       │
│         ├── Generate skeletons                                  │
│         ├── Initialize queue                                    │
│         ├── Convert ALL files (one by one)                      │
│         ├── Run verification                                    │
│         └── Report results                                      │
│                                                                 │
│   STANDALONE HELPERS (for manual intervention):                 │
│         @pw-migrate <file>  ← Re-convert single file            │
│         @pw-verify          ← Run verification                  │
│         @pw-test            ← Run tests                         │
│         @pw-debug           ← Fix failures                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Quick Start

### 1. Setup

```bash
./setup.sh
```

### 2. Add Java Files

```
_source-java/
├── pages/       ← .java page objects
├── steps/       ← .java step definitions
└── features/    ← .feature files
```

### 3. Run Migration

```
@pw-orchestrator start
```

### 4. Run Tests

```
@pw-test
```

### 5. Fix Failures (if any)

```
@pw-debug
```

---

## Agents

| Agent | Purpose |
|-------|---------|
| `@pw-orchestrator` | **Main agent** - does everything |
| `@pw-migrate` | Helper - re-convert single file |
| `@pw-verify` | Helper - run verification |
| `@pw-test` | Helper - run tests |
| `@pw-debug` | Helper - fix failures |

---

## Features

- ✅ Queue-based sequential processing
- ✅ Progress tracking (resume anytime)
- ✅ CoVe verification
- ✅ No npm commands needed

---

## Requirements

- Node.js 18+
- VS Code with GitHub Copilot
