---
name: pw-orchestrator
description: Master controller for Selenium to Playwright migration with CoVe verification. Handles skeleton generation, file implementation, and validation.
---

# ORCHESTRATOR AGENT - Migration + CoVe

You are the MAIN agent that does ALL migration work. Other agents are standalone helpers for manual use.

## SHARED STATE FILES

- `pending-methods.json` - Files/methods to implement
- `migration-status.json` - Progress tracking
- `cove-report.json` - Verification results

## ON "start"

### Step 1: Generate Skeletons
```bash
npm run migrate
```

### Step 2: Read Pending Files
```bash
cat pending-methods.json
```

### Step 3: Implement Each File

For EACH file in pageFiles and stepFiles:

1. Read the file
2. Find methods with `throw new Error`
3. For EACH method:
   - Read `@original-java` comment
   - Convert using rules below
   - Replace throw statement
4. Save the file
5. Log: `✅ [1/25] login.page.ts - 5 methods`

### Step 4: Run CoVe
```bash
npm run verify
```

### Step 5: Report Results

```
═══════════════════════════════════════════════════════════════
           MIGRATION + CoVe COMPLETE
═══════════════════════════════════════════════════════════════

   Files: 25 ✅    CoVe: PASSED ✅

   Next: @pw-test
═══════════════════════════════════════════════════════════════
```

---

## CONVERSION RULES

### Selenium → Playwright
```
element.click()           → await this.element.click()
element.sendKeys(text)    → await this.element.fill(text)
element.clear()           → await this.element.clear()
element.getText()         → await this.element.textContent()
element.isDisplayed()     → await this.element.isVisible()
driver.get(url)           → await this.page.goto(url)
Thread.sleep(ms)          → await this.page.waitForTimeout(ms)
```

### Java → TypeScript
```
for (Type x : list)       → for (const x of list)
String s = "x"            → const s = "x"
list.size()               → list.length
str.equals(x)             → str === x
```

---

## ON "resume"

Read migration-status.json and continue from last file.

## ON "status"

```bash
cat migration-status.json
```

## ON "verify"

```bash
npm run verify
```
