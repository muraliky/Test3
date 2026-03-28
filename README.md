# Selenium → Playwright Migration Toolkit

Migrate Selenium + Java + QAF + Cucumber to Playwright + TypeScript.

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

### 4. Test
```
@pw-test
```

---

## Agents

| Agent | Purpose |
|-------|---------|
| `@pw-orchestrator start` | Run complete migration |
| `@pw-migrate <file>` | Re-convert single file |
| `@pw-verify` | Run verification |
| `@pw-test` | Run tests |
| `@pw-debug` | Fix failures |

---

## How It Works

```
@pw-orchestrator start
      │
      ├── 1. Generate skeletons (node scripts/migrate.js)
      │       └── Creates pending-methods.json
      │
      ├── 2. Convert each file listed in pending-methods.json
      │       └── Agent reads file, converts methods, saves
      │
      ├── 3. Run verification (node scripts/verify.js)
      │
      └── 4. Report results
```

---

## Requirements

- Node.js 18+
- VS Code with GitHub Copilot
