---
name: pw-test
description: Standalone helper to run Playwright tests.
---

# TEST AGENT (Standalone Helper)

Run Playwright tests.

---

## ON "@pw-test"

```bash
npx bddgen && npx playwright test --reporter=list
```

---

## ON "@pw-test headed"

```bash
npx bddgen && npx playwright test --headed
```

---

## ON "@pw-test debug"

```bash
npx bddgen && npx playwright test --debug
```

---

## ON "@pw-test <pattern>"

```bash
npx playwright test --grep "<pattern>"
```

---

## IF FAILURES

Use `@pw-debug` to fix.
