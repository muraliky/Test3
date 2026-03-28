---
name: pw-debug
description: Fix failing Playwright tests.
---

# DEBUG AGENT

## ON "@pw-debug"

1. Run: `npx playwright test 2>&1 | head -50`
2. Analyze failures
3. Fix locators using priority:
   - `getByRole()` 
   - `getByTestId()`
   - `getByText()`
   - `locator()`
4. Re-run: `@pw-test`
