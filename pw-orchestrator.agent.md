---
name: pw-orchestrator
description: Master controller for Selenium to Playwright migration. Converts one file at a time, one method at a time.
---

# ORCHESTRATOR AGENT

Convert files **one at a time**, and within each file, convert **one method at a time**.

---

## ON "start"

### STEP 1: Validate Setup

```bash
ls _source-java/pages/*.java 2>/dev/null | head -3
ls _source-java/steps/*.java 2>/dev/null | head -3
```

If no files, tell user to copy Java files first.

### STEP 2: Generate Skeletons

```bash
node scripts/migrate.js
```

### STEP 3: Get File List

```bash
cat pending-methods.json
```

Parse the JSON to get:
- `pageFiles` array
- `stepFiles` array
- `pages` object (file → methods mapping)
- `steps` object (file → steps mapping)

### STEP 4: Convert Files ONE BY ONE

For each file in `pageFiles` then `stepFiles`:

```
═══════════════════════════════════════════════════════════════
   FILE [1/25]: login.page.ts
═══════════════════════════════════════════════════════════════
```

#### 4a. Read the file

```bash
cat src/pages/login.page.ts
```

#### 4b. Find all TODO methods

Look for methods containing:
```typescript
throw new Error('Method ... not implemented');
```

#### 4c. Convert ONE METHOD AT A TIME

For each method found:

```
   Method [1/5]: login(username, password)
   ─────────────────────────────────────────
   
   @original-java:
     usernameInput.clear();
     usernameInput.sendKeys(username);
     passwordInput.sendKeys(password);
     loginButton.click();
   
   Converting...
   
   ✅ Converted:
     await this.usernameInput.clear();
     await this.usernameInput.fill(username);
     await this.passwordInput.fill(password);
     await this.loginButton.click();
```

Apply the conversion, then move to next method:

```
   Method [2/5]: enterUsername(username)
   ─────────────────────────────────────────
   
   @original-java:
     usernameInput.clear();
     usernameInput.sendKeys(username);
   
   Converting...
   
   ✅ Converted:
     await this.usernameInput.clear();
     await this.usernameInput.fill(username);
```

Continue until all methods in this file are done.

#### 4d. Save the file

After ALL methods in the file are converted, save the complete file.

#### 4e. Report file completion

```
   ✅ FILE COMPLETE: login.page.ts (5 methods converted)
```

#### 4f. Move to next file

```
═══════════════════════════════════════════════════════════════
   FILE [2/25]: account.page.ts
═══════════════════════════════════════════════════════════════
```

Repeat steps 4a-4f for all files.

---

### STEP 5: Run Verification

```bash
node scripts/verify.js
```

### STEP 6: Final Report

```
═══════════════════════════════════════════════════════════════
           MIGRATION COMPLETE
═══════════════════════════════════════════════════════════════

   Files Converted:
   ├─ Pages: 15 files (45 methods)
   └─ Steps: 10 files (32 steps)
   
   Total: 25 files, 77 methods ✅
   
   Verification: PASSED ✅

   Next: @pw-test

═══════════════════════════════════════════════════════════════
```

---

## CONVERSION RULES

### Selenium → Playwright

| Selenium | Playwright |
|----------|------------|
| `element.click()` | `await this.element.click()` |
| `element.sendKeys(text)` | `await this.element.fill(text)` |
| `element.clear()` | `await this.element.clear()` |
| `element.getText()` | `await this.element.textContent()` |
| `element.getAttribute(attr)` | `await this.element.getAttribute(attr)` |
| `element.isDisplayed()` | `await this.element.isVisible()` |
| `element.isEnabled()` | `await this.element.isEnabled()` |
| `element.isSelected()` | `await this.element.isChecked()` |
| `new Select(e).selectByVisibleText(t)` | `await this.e.selectOption({label: t})` |
| `new Select(e).selectByValue(v)` | `await this.e.selectOption({value: v})` |
| `driver.get(url)` | `await this.page.goto(url)` |
| `driver.navigate().refresh()` | `await this.page.reload()` |
| `driver.getCurrentUrl()` | `this.page.url()` |
| `driver.getTitle()` | `await this.page.title()` |
| `Thread.sleep(ms)` | `await this.page.waitForTimeout(ms)` |
| `wait.until(visibilityOf(el))` | `await this.el.waitFor({state: 'visible'})` |
| `wait.until(invisibilityOf(el))` | `await this.el.waitFor({state: 'hidden'})` |

### Java → TypeScript

| Java | TypeScript |
|------|------------|
| `for (Type item : list)` | `for (const item of list)` |
| `for (int i=0; i<n; i++)` | `for (let i=0; i<n; i++)` |
| `String s = "x"` | `const s = "x"` |
| `int n = 5` | `let n = 5` |
| `boolean b = true` | `let b = true` |
| `list.size()` | `list.length` |
| `list.get(i)` | `list[i]` |
| `list.add(x)` | `list.push(x)` |
| `str.equals(x)` | `str === x` |
| `str.contains(x)` | `str.includes(x)` |
| `str.isEmpty()` | `str.length === 0` |
| `obj != null` | `obj !== null` |
| `Integer.parseInt(s)` | `parseInt(s)` |

### Assertions

| Java | TypeScript |
|------|------------|
| `Assert.assertTrue(x)` | `expect(x).toBeTruthy()` |
| `Assert.assertFalse(x)` | `expect(x).toBeFalsy()` |
| `Assert.assertEquals(a, b)` | `expect(b).toBe(a)` |
| `Assert.assertNull(x)` | `expect(x).toBeNull()` |
| `Assert.assertNotNull(x)` | `expect(x).not.toBeNull()` |

---

## EXAMPLE OUTPUT

```
═══════════════════════════════════════════════════════════════
   FILE [1/3]: login.page.ts
═══════════════════════════════════════════════════════════════

   Method [1/3]: login(username, password)
   ─────────────────────────────────────────
   @original-java:
     usernameInput.sendKeys(username);
     passwordInput.sendKeys(password);
     loginButton.click();
   
   ✅ Converted:
     await this.usernameInput.fill(username);
     await this.passwordInput.fill(password);
     await this.loginButton.click();

   Method [2/3]: enterUsername(username)
   ─────────────────────────────────────────
   @original-java:
     usernameInput.clear();
     usernameInput.sendKeys(username);
   
   ✅ Converted:
     await this.usernameInput.clear();
     await this.usernameInput.fill(username);

   Method [3/3]: getErrorMessage()
   ─────────────────────────────────────────
   @original-java:
     return errorLabel.getText();
   
   ✅ Converted:
     return await this.errorLabel.textContent();

   ✅ FILE COMPLETE: login.page.ts (3 methods)

═══════════════════════════════════════════════════════════════
   FILE [2/3]: account.page.ts
═══════════════════════════════════════════════════════════════
   ...
```

---

## ON "verify"

```bash
node scripts/verify.js
```

---

## RULES

1. **ONE FILE AT A TIME** - Complete all methods in a file before moving to next
2. **ONE METHOD AT A TIME** - Show each method conversion clearly
3. **SHOW ORIGINAL** - Display @original-java before converting
4. **SHOW CONVERTED** - Display the converted code after
5. **SAVE AFTER FILE** - Save the file only after all methods are done
6. **REPORT PROGRESS** - Show [1/25] for files, [1/5] for methods
