---
name: pw-debug
description: Standalone helper to fix failing Playwright tests.
---

# DEBUG AGENT (Standalone Helper)

Fix failing tests.

---

## ON "@pw-debug"

1. Run tests: `npx playwright test 2>&1 | head -50`
2. Parse failures
3. Fix each issue
4. Report fixes

---

## COMMON FIXES

### Not Found
```typescript
// page.locator('#btn') →
page.getByRole('button', { name: 'Submit' })
page.getByTestId('submit-btn')
```

### Multiple Elements
```typescript
// page.locator('.btn') →
page.locator('.btn').first()
```

### Timeout
```typescript
await element.waitFor({ state: 'visible' });
await element.click();
```

---

## LOCATOR PRIORITY

1. `getByRole()` - Best
2. `getByTestId()`
3. `getByLabel()`
4. `getByText()`
5. `locator()` - Last resort

---

## AFTER FIXING

Re-run: `@pw-test`
