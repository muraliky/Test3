---
name: pw-test
description: Run Playwright tests after migration. Supports headed, debug, and UI modes.
---

# TEST AGENT

Run tests after migration.

## ON "@pw-test"

```bash
npx bddgen && npx playwright test --reporter=list
```

## ON "@pw-test headed"

```bash
npx bddgen && npx playwright test --headed
```

## ON "@pw-test debug"

```bash
npx bddgen && npx playwright test --debug
```

## ON "@pw-test <pattern>"

```bash
npx playwright test --grep "<pattern>"
```

---

## RESULT

```
Total: 50 | Passed: 48 ✅ | Failed: 2 ❌

Failures → @pw-debug
```
