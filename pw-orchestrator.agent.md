---
name: pw-orchestrator
description: Selenium to Playwright migration. Converts ONE file at a time, ONE method at a time. No deviation.
---

# ORCHESTRATOR AGENT

## CRITICAL RULES

1. **ONE FILE AT A TIME** - Never work on multiple files simultaneously
2. **ONE METHOD AT A TIME** - Convert each method individually, show before/after
3. **COMPLETE FILE BEFORE NEXT** - Finish ALL methods in current file before moving to next
4. **NO SKIPPING** - Process every method, every file
5. **SAVE AFTER EACH FILE** - Write file only after all its methods are done

---

## ON "start"

### 1. Generate Skeletons

```bash
node scripts/migrate.js
```

### 2. Get File List

```bash
cat pending-methods.json
```

### 3. Create Progress File

Create `migration-progress.json`:
```json
{
  "completedFiles": [],
  "totalFiles": <count>
}
```

### 4. Process First File

Pick FIRST file from `pageFiles` array. Go to **FILE PROCESSING** section below.

---

## ON "resume"

### 1. Read Progress

```bash
cat migration-progress.json
```

### 2. Find Next File

Compare `completedFiles` with files in `pending-methods.json`. Find first file NOT in `completedFiles`.

### 3. Continue

Go to **FILE PROCESSING** section below with that file.

---

## FILE PROCESSING

**DO THIS FOR ONE FILE ONLY. DO NOT PROCEED TO NEXT FILE UNTIL COMPLETE.**

### Step A: Announce File

```
═══════════════════════════════════════════════════════════════
   FILE [X/Y]: <filename>
═══════════════════════════════════════════════════════════════
```

### Step B: Read File

```bash
cat src/pages/<filename>
```

### Step C: List All Methods

Find all methods with `throw new Error('Method ... not implemented')` or `throw new Error('Step not implemented')`.

List them:
```
   Methods to convert:
   1. login(username, password)
   2. enterUsername(username)
   3. clickLoginButton()
   4. getErrorMessage()
```

### Step D: Convert Method 1

Look for the `// Original Java:` comment block above the throw statement.

```
   ─────────────────────────────────────────
   METHOD [1/4]: login(username, password)
   ─────────────────────────────────────────

   ORIGINAL JAVA (from comments):
   usernameInput.clear();
   usernameInput.sendKeys(username);
   passwordInput.sendKeys(password);
   loginButton.click();

   CONVERTED TYPESCRIPT:
   await this.usernameInput.clear();
   await this.usernameInput.fill(username);
   await this.passwordInput.fill(password);
   await this.loginButton.click();

   ✅ Method 1 done
```

**IMPORTANT:** After converting, remove the `// TODO:` and `// Original Java:` comments. The final method should be clean:

```typescript
/**
 * Login
 * @param {string} username - The username
 * @param {string} password - The password
 * @returns {Promise<void>}
 */
async login(username: string, password: string): Promise<void> {
  await this.usernameInput.clear();
  await this.usernameInput.fill(username);
  await this.passwordInput.fill(password);
  await this.loginButton.click();
}
```

### Step E: Convert Method 2

```
   ─────────────────────────────────────────
   METHOD [2/4]: enterUsername(username)
   ─────────────────────────────────────────

   ORIGINAL JAVA:
   usernameInput.clear();
   usernameInput.sendKeys(username);

   CONVERTED TYPESCRIPT:
   await this.usernameInput.clear();
   await this.usernameInput.fill(username);

   ✅ Method 2 done
```

### Step F: Continue Until All Methods Done

Repeat for Method 3, Method 4, etc.

**DO NOT SKIP ANY METHOD.**

### Step G: Save Complete File

After ALL methods are converted, save the file with all changes.

### Step H: Update Progress

Add filename to `completedFiles` in `migration-progress.json`.

### Step I: Report File Done

```
   ✅ FILE COMPLETE: <filename>
   Methods converted: 4/4
```

### Step J: Next File

```
═══════════════════════════════════════════════════════════════
   FILE [X+1/Y]: <next-filename>
═══════════════════════════════════════════════════════════════
```

Go back to Step B with next file.

---

## CONVERSION TABLE

| Selenium | Playwright |
|----------|------------|
| `el.click()` | `await this.el.click()` |
| `el.sendKeys(text)` | `await this.el.fill(text)` |
| `el.clear()` | `await this.el.clear()` |
| `el.getText()` | `await this.el.textContent()` |
| `el.isDisplayed()` | `await this.el.isVisible()` |
| `el.isEnabled()` | `await this.el.isEnabled()` |
| `el.getAttribute(x)` | `await this.el.getAttribute(x)` |
| `driver.get(url)` | `await this.page.goto(url)` |
| `Thread.sleep(ms)` | `await this.page.waitForTimeout(ms)` |
| `new Select(el).selectByVisibleText(t)` | `await this.el.selectOption({label: t})` |

| Java | TypeScript |
|------|------------|
| `for (Type x : list)` | `for (const x of list)` |
| `String s = "x"` | `const s = "x"` |
| `list.size()` | `list.length` |
| `str.equals(x)` | `str === x` |

---

## ON "status"

```bash
cat migration-progress.json
```

Show completed vs total.

---

## ON "verify"

```bash
node scripts/verify.js
```

---

## EXAMPLE SESSION

```
═══════════════════════════════════════════════════════════════
   FILE [1/3]: login.page.ts
═══════════════════════════════════════════════════════════════

   Methods to convert:
   1. login(username, password)
   2. getErrorMessage()

   ─────────────────────────────────────────
   METHOD [1/2]: login(username, password)
   ─────────────────────────────────────────

   ORIGINAL JAVA:
   usernameInput.sendKeys(username);
   passwordInput.sendKeys(password);
   loginButton.click();

   CONVERTED TYPESCRIPT:
   await this.usernameInput.fill(username);
   await this.passwordInput.fill(password);
   await this.loginButton.click();

   ✅ Method 1 done

   ─────────────────────────────────────────
   METHOD [2/2]: getErrorMessage()
   ─────────────────────────────────────────

   ORIGINAL JAVA:
   return errorLabel.getText();

   CONVERTED TYPESCRIPT:
   return await this.errorLabel.textContent();

   ✅ Method 2 done

   ✅ FILE COMPLETE: login.page.ts (2 methods)

═══════════════════════════════════════════════════════════════
   FILE [2/3]: account.page.ts
═══════════════════════════════════════════════════════════════

   Methods to convert:
   1. getBalance()

   ─────────────────────────────────────────
   METHOD [1/1]: getBalance()
   ─────────────────────────────────────────

   ... (continues)
```
