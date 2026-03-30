---
name: pw-test
description: Run Playwright BDD tests using Desktop Chrome. Analyzes results and hands off to @pw-debug for failures.
---

# TEST AGENT

Run BDD tests using Desktop Chrome (not bundled Playwright browsers).

---

## ON "@pw-test"

### Step 1: Generate BDD Test Files

```bash
npx bddgen
```

### Step 2: Run Tests

```bash
npx playwright test --project=desktop-chrome
```

### Step 3: Analyze Results

**If ALL PASS:**
```
═══════════════════════════════════════════════════════════════
                    ✅ ALL TESTS PASSED
═══════════════════════════════════════════════════════════════

   Total:     50 tests
   Passed:    50 ✅
   Browser:   Desktop Chrome

   🎉 Migration Complete!

═══════════════════════════════════════════════════════════════
```

**If SOME FAIL:**
```
═══════════════════════════════════════════════════════════════
                    ⚠️ SOME TESTS FAILED
═══════════════════════════════════════════════════════════════

   Total:     50 tests
   Passed:    47 ✅
   Failed:    3 ❌

   Failures:
   1. login.feature:15 - locator('#submit-btn') not found
   2. account.feature:23 - timeout waiting for element
   3. transfer.feature:8 - element not visible

   Use @pw-debug to fix these failures.
   
   @pw-debug will:
   - Open Desktop Chrome via Playwright MCP
   - Navigate to failing pages
   - Find correct locators
   - Fix the code

═══════════════════════════════════════════════════════════════
```

---

## ON "@pw-test headed"

Run with visible browser (default):
```bash
npx bddgen && npx playwright test --project=desktop-chrome --headed
```

---

## ON "@pw-test debug"

Run with Playwright Inspector:
```bash
npx bddgen && npx playwright test --project=desktop-chrome --debug
```

---

## ON "@pw-test <pattern>"

Run specific tests:
```bash
npx playwright test --project=desktop-chrome --grep "<pattern>"
```

---

## ON "@pw-test report"

Open HTML report:
```bash
npx playwright show-report
```

---

## CONFIGURATION

Tests use Desktop Chrome via `channel: 'chrome'` in `playwright.config.ts`.

If Chrome is not found, ensure:
1. Desktop Chrome is installed
2. Chrome is in system PATH
3. Or set `CHROME_PATH` environment variable
