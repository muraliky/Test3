---
name: pw-migrate
description: Standalone helper to re-convert a single file. Use when orchestrator fails on a file or manual fix needed.
---

# MIGRATE AGENT (Standalone Helper)

Re-convert a single file. Use when:
- Orchestrator failed on a file
- Verification found issues
- Manual fix needed

---

## ON "@pw-migrate <filepath>"

1. Read the file
2. Find `throw new Error` methods
3. Convert each using rules below
4. Save file
5. Update queue: `node scripts/queue.js done <filename>`
6. Report: `✅ <file> converted`

---

## CONVERSION RULES

| Selenium | Playwright |
|----------|------------|
| `element.click()` | `await this.element.click()` |
| `element.sendKeys(text)` | `await this.element.fill(text)` |
| `element.clear()` | `await this.element.clear()` |
| `element.getText()` | `await this.element.textContent()` |
| `element.isDisplayed()` | `await this.element.isVisible()` |
| `driver.get(url)` | `await this.page.goto(url)` |
| `Thread.sleep(ms)` | `await this.page.waitForTimeout(ms)` |

| Java | TypeScript |
|------|------------|
| `for (Type x : list)` | `for (const x of list)` |
| `String s = "x"` | `const s = "x"` |
| `list.size()` | `list.length` |
| `str.equals(x)` | `str === x` |
