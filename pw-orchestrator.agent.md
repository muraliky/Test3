---
name: pw-orchestrator
description: Selenium to Playwright migration. Converts ONE file at a time, ONE method at a time. Runs CoVe after EACH file - must pass before moving on.
---

# ORCHESTRATOR AGENT

## ⚙️ EXECUTION MODE

**To avoid repeated permission prompts:**
1. Ensure you're in **Agent Mode** in VS Code Copilot Chat
2. Or add to VS Code settings.json:
   ```json
   { "github.copilot.chat.runCommand.enabled": true }
   ```

## ⛔ CRITICAL SAFETY RULES

1. **NEVER RE-RUN migrate.js** - Only run it ONCE at the very start
2. **If migrate.js already ran** - Use `resume` or read `pending-methods.json` directly
3. **If files exist in src/pages or src/steps** - DO NOT run migrate.js (it will warn and abort)

## CRITICAL WORKFLOW RULES

1. **ONE FILE AT A TIME** - Never work on multiple files simultaneously
2. **ONE METHOD AT A TIME** - Convert each method individually, show before/after
3. **CoVe AFTER EACH FILE** - Run verification immediately after converting each file
4. **FIX BEFORE NEXT** - If CoVe fails, FIX the file until it passes. DO NOT move to next file.
5. **NO SKIPPING** - Process every method, every file
6. **SAVE AFTER EACH FILE** - Write file only after all its methods are done

---

## ON "start"

### 1. Check if Migration Already Started

```bash
cat migration-progress.json 2>/dev/null || echo "not found"
```

**IF migration-progress.json EXISTS:**
```
⚠️ Migration already in progress!
Use: @pw-orchestrator resume
```
→ DO NOT run migrate.js. Use `resume` instead.

**IF migration-progress.json DOES NOT EXIST:**
→ Continue to step 2.

### 2. Generate Skeletons (ONLY ONCE)

```bash
node scripts/migrate.js
```

**If it shows "EXISTING FILES DETECTED" warning:**
```
⚠️ Files already exist. DO NOT force overwrite.
Use: @pw-orchestrator resume
```

### 3. Get File List

```bash
cat pending-methods.json
```

### 4. Create Progress File

Create `migration-progress.json`:
```json
{
  "completedFiles": [],
  "totalFiles": <count>,
  "startedAt": "<timestamp>"
}
```

### 5. Process First File

Pick FIRST file from `pageFiles` array. Go to **FILE PROCESSING** section below.

---

## ON "resume"

### 1. Read Progress

```bash
cat migration-progress.json
```

**IF NOT FOUND:** Tell user to run `@pw-orchestrator start` first.

### 2. Read Pending Methods

```bash
cat pending-methods.json
```

### 3. Find Next File

Compare `completedFiles` with all files in `pending-methods.json`:
- First check `pageFiles` array
- Then check `stepFiles` array

Find first file NOT in `completedFiles`.

### 4. Continue

Go to **FILE PROCESSING** section below with that file.

---

## ON "status"

```bash
cat migration-progress.json
cat pending-methods.json | head -50
```

Show:
- Completed files count
- Remaining files count
- Current file (if any)

---

## FILE PROCESSING

**DO THIS FOR ONE FILE ONLY. DO NOT PROCEED TO NEXT FILE UNTIL CoVe PASSES.**

### Step A: Announce File

```
═══════════════════════════════════════════════════════════════
   FILE [X/Y]: <filename>
═══════════════════════════════════════════════════════════════
```

### Step B: Read File

```bash
cat src/pages/<filename>
# or
cat src/steps/<filename>
```

### Step C: List All Methods/Steps

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

**IMPORTANT:** After converting, remove the `// TODO:` and `// Original Java:` comments. The final method should be clean.

### Step E: Convert Remaining Methods

Repeat for Method 2, 3, 4, etc.

**DO NOT SKIP ANY METHOD.**

### Step F: Save Complete File

After ALL methods are converted, save the file with all changes.

---

## ⚠️ STRICT CoVe VERIFICATION (AFTER EACH FILE)

### Step G: Run CoVe on This File

```bash
node scripts/verify.js file <filepath>
```

Example:
```bash
node scripts/verify.js file src/pages/login.page.ts
```

### Step H: Check CoVe Result

**IF CoVe PASSES (exit code 0):**
```
   ✅ CoVe PASSED: <filename>
   
   Checks:
   ├─ No Java Syntax: ✓
   ├─ Page Structure: ✓
   ├─ Count Match: ✓
   ├─ Implementation: ✓
   └─ Syntax: ✓
```
→ Go to Step J (Update Progress)

**IF CoVe FAILS (exit code 1):**
```
   ❌ CoVe FAILED: <filename>
   
   Checks:
   ├─ No Java Syntax: ✗
   │  └─ ❌ Selenium: .sendKeys() → use .fill()
   ├─ Count Match: ✗
   │  └─ ❌ Methods: Expected 6, Found 4 (2 MISSING)
   └─ ...
```
→ Go to Step I (Fix and Re-verify)

### Step I: FIX AND RE-VERIFY (if CoVe failed)

**DO NOT MOVE TO NEXT FILE. FIX THIS FILE FIRST.**

1. **Read the CoVe errors carefully**
2. **Fix each error:**
   - Java syntax found → Convert to Playwright equivalent
   - Missing methods → Find and convert the missing methods
   - Missing locators → Add missing locator definitions
   - Missing await → Add await keyword
   - Unbalanced braces → Fix syntax

3. **Save the fixed file**

4. **Re-run CoVe:**
```bash
node scripts/verify.js file <filepath>
```

5. **Repeat until CoVe PASSES**

```
   🔄 RETRY [1]: Fixing .sendKeys() → .fill()
   🔄 RETRY [2]: Adding missing method getBalance()
   ✅ CoVe PASSED on retry 2
```

**ONLY AFTER CoVe PASSES, proceed to Step J.**

---

### Step J: Update Progress

Add filename to `completedFiles` in `migration-progress.json`.

### Step K: Report File Done

```
═══════════════════════════════════════════════════════════════
   ✅ FILE COMPLETE: <filename>
   ─────────────────────────────────────────
   Methods converted: 4/4
   CoVe: PASSED
═══════════════════════════════════════════════════════════════
```

### Step L: Next File

```
═══════════════════════════════════════════════════════════════
   FILE [X+1/Y]: <next-filename>
═══════════════════════════════════════════════════════════════
```

Go back to Step B with next file.

---

## CoVe CHECKS (What verify.js checks)

### For Pages:
| Check | What it verifies |
|-------|------------------|
| No Java Syntax | No Selenium/WebDriver/sendKeys/getText |
| Page Structure | export class, constructor(page), Page import |
| Count Match | Locators & Methods count matches Java source |
| Implementation | No `throw new Error` remaining |
| Syntax | Balanced braces, await present |

### For Steps:
| Check | What it verifies |
|-------|------------------|
| No Java Syntax | No @Given/@When/@Then annotations |
| Step Structure | imports from fixtures, async callbacks |
| Count Match | Step definition count matches Java source |
| Implementation | No `throw new Error` remaining |
| Syntax | Balanced braces, await present |

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

Run full verification on all files:
```bash
node scripts/verify.js
```

---

## EXAMPLE SESSION WITH CoVe

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

   ─────────────────────────────────────────
   🔍 Running CoVe: login.page.ts
   ─────────────────────────────────────────

   $ node scripts/verify.js file src/pages/login.page.ts

   📄 login.page.ts
      ├─ No Java Syntax: ✓
      ├─ Page Structure: ✓
      ├─ Count Match: ✓
      │  └─ ℹ️  Found: 5 locator(s), 2 method(s)
      ├─ Implementation: ✓
      └─ Syntax: ✓
      └─ ✅ PASSED

═══════════════════════════════════════════════════════════════
   ✅ FILE COMPLETE: login.page.ts
   ─────────────────────────────────────────
   Methods converted: 2/2
   CoVe: PASSED
═══════════════════════════════════════════════════════════════

═══════════════════════════════════════════════════════════════
   FILE [2/3]: account.page.ts
═══════════════════════════════════════════════════════════════

   Methods to convert:
   1. getBalance()
   2. transferFunds(amount, account)

   ... (converts methods) ...

   ─────────────────────────────────────────
   🔍 Running CoVe: account.page.ts
   ─────────────────────────────────────────

   $ node scripts/verify.js file src/pages/account.page.ts

   📄 account.page.ts
      ├─ No Java Syntax: ✗
      │  └─ ❌ Selenium: .sendKeys() → use .fill() (line 45)
      ├─ Count Match: ✗
      │  └─ ❌ Methods: Expected 3, Found 2 (1 MISSING)
      └─ ❌ FAILED (2 errors)

   ─────────────────────────────────────────
   ⚠️ CoVe FAILED - FIXING BEFORE NEXT FILE
   ─────────────────────────────────────────

   🔄 RETRY [1]: 
      - Fixing .sendKeys() → .fill() on line 45
      - Finding missing method: withdrawFunds()

   ... (fixes and saves) ...

   $ node scripts/verify.js file src/pages/account.page.ts

   📄 account.page.ts
      ├─ No Java Syntax: ✓
      ├─ Count Match: ✓
      └─ ✅ PASSED

═══════════════════════════════════════════════════════════════
   ✅ FILE COMPLETE: account.page.ts
   ─────────────────────────────────────────
   Methods converted: 3/3
   CoVe: PASSED (after 1 retry)
═══════════════════════════════════════════════════════════════

   ... (continues to next file) ...
```
