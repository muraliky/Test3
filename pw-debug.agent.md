---
name: pw-debug
description: Fix failing Playwright tests by analyzing errors and finding correct locators.
---

# DEBUG AGENT

Fix failing tests.

## ON "@pw-debug <error>"

1. Parse error for file/line/locator
2. Suggest fixes
3. Apply fix
4. Report: `✅ Fixed <file>:<line>`

## ON "@pw-debug"

```bash
npx playwright test 2>&1 | head -50
```

Then fix first failure.

---

## LOCATOR PRIORITY

1. `getByRole('button', { name: 'X' })`
2. `getByTestId('x')`
3. `getByLabel('X')`
4. `locator('#id')`
5. `locator('.class')`

---

## COMMON FIXES

**Not Found:**
```typescript
// page.locator('#btn') →
page.getByRole('button', { name: 'Submit' })
```

**Multiple Elements:**
```typescript
// page.locator('.btn') →
page.locator('.btn').first()
```

**Timeout:**
```typescript
await element.waitFor({ state: 'visible' });
await element.click();
```
