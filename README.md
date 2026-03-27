# Selenium to Playwright-BDD Migration Toolkit

## Hybrid Architecture: CoVe + Playwright MCP

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  PHASE 1: Migration + CoVe Verification                        │
│  ══════════════════════════════════════                         │
│  (Local execution - No MCP required)                            │
│                                                                 │
│  @pw-orchestrator start                                         │
│     ├─ npm run migrate         → Skeleton generation            │
│     ├─ Implement each file     → Convert Java to TypeScript     │
│     └─ npm run verify          → CoVe validation                │
│         ├─ Structure check     ✓ Class, imports, no Java        │
│         ├─ Implementation check ✓ No TODO, await usage          │
│         ├─ Count match check   ✓ Locators/methods match         │
│         └─ Syntax check        ✓ Balanced braces/parens         │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  PHASE 2: Test Execution + Debug                                │
│  ═══════════════════════════════                                │
│  (Uses Playwright MCP Server)                                   │
│                                                                 │
│  @pw-test                                                       │
│     ├─ Run bddgen + playwright test                             │
│     └─ Report pass/fail results                                 │
│                                                                 │
│  @pw-debug                                                      │
│     ├─ Navigate to page with MCP browser                        │
│     ├─ Inspect DOM to find correct locators                     │
│     ├─ Update files with fixes                                  │
│     └─ Re-run tests to verify                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Quick Start

```bash
# 1. Setup
setup.bat           # Windows
./setup.sh          # Mac/Linux

# 2. Copy your Java source files to _source-java/
#    ├── pages/     → Your Page Objects
#    ├── steps/     → Your Step Definitions  
#    └── features/  → Your .feature files

# 3. Run automated migration with CoVe
@pw-orchestrator start

# 4. Run tests with Playwright MCP
@pw-test

# 5. Fix any failures with MCP browser
@pw-debug
```

---

## Agents Overview

| Agent | Phase | MCP | Purpose |
|-------|-------|-----|---------|
| `@pw-orchestrator` | 1 | ❌ | Master controller - migration + CoVe |
| `@pw-migrate` | 1 | ❌ | Implement single file |
| `@pw-verify` | 1 | ❌ | Run CoVe checks only |
| `@pw-test` | 2 | ✅ | Run tests with live browser |
| `@pw-debug` | 2 | ✅ | Fix failures using MCP browser |

---

## Phase 1: Migration + CoVe

### Start Full Migration
```
@pw-orchestrator start
```

### What Happens
1. **Skeleton Generation**: `npm run migrate`
   - Parses Java pages/steps/features
   - Converts locators to Playwright
   - Creates TypeScript files with TODO markers
   - Generates `pending-methods.json`

2. **Implementation**: For each file
   - Reads `@original-java` comments
   - Converts to Playwright TypeScript
   - Replaces TODO with implementation

3. **CoVe Verification**: `npm run verify`
   - Validates each file through 4 checks
   - Reports pass/fail with details

### CoVe Checks

```
┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│ 1.STRUCTURE │ → │ 2.IMPLEMENT │ → │ 3.COUNT     │ → │ 4.SYNTAX    │
│             │   │             │   │   MATCH     │   │             │
│ • Class     │   │ • No TODO   │   │             │   │ • Braces    │
│   export    │   │   markers   │   │ • Locators  │   │   balanced  │
│ • Imports   │   │ • async/    │   │   match     │   │ • Parens    │
│   correct   │   │   await     │   │   source    │   │   balanced  │
│ • No Java   │   │ • this.     │   │ • Methods   │   │ • No double │
│   syntax    │   │   prefix    │   │   match     │   │   keywords  │
└─────────────┘   └─────────────┘   └─────────────┘   └─────────────┘
```

### CoVe Output
```
═══════════════════════════════════════════════════════════════
              CHAIN OF VERIFICATION (CoVe)
═══════════════════════════════════════════════════════════════

   Checks: Structure | Implementation | Count Match | Syntax
   (Test execution handled separately by @pw-test with MCP)

   Found 25 files to verify
   ├─ 15 page files
   └─ 10 step files

───────────────────────────────────────────────────────────────
   VERIFICATION RESULTS
───────────────────────────────────────────────────────────────

   📄 login.page.ts
      ├─ Structure...
      ├─ Implementation...
      ├─ Count Match...
      ├─ Syntax...
      └─ ✅ PASSED

   📄 account.page.ts
      ├─ Structure...
      ├─ Implementation...
      ├─ Count Match...
      ├─ Syntax...
      └─ ✅ PASSED

═══════════════════════════════════════════════════════════════
                     CoVe SUMMARY
═══════════════════════════════════════════════════════════════

   Files Verified:  25
   ├─ Passed:       25 ✅
   ├─ Failed:       0 ❌
   └─ Warnings:     2 ⚠️

   ═══════════════════════════════════════════════════════════
   ✅ ALL FILES VERIFIED - Ready for test execution
   ═══════════════════════════════════════════════════════════

   Next: Run tests with Playwright MCP
         @pw-test
```

### Manual Phase 1 Commands
```bash
npm run migrate           # Create skeletons only
npm run verify            # Run CoVe on all files
npm run verify:file <f>   # Verify single file
```

---

## Phase 2: Test Execution + Debug (MCP)

### Prerequisites: Playwright MCP Server

**Option 1: VS Code Extension**
```
Install "Playwright MCP" extension
```

**Option 2: npx**
```bash
npx @anthropic-ai/mcp-server-playwright
```

**Option 3: Organization URL**
```yaml
# In agent file
mcp_servers:
  - type: url
    url: https://playwright.mcp.your-org.com/sse
```

### Run Tests
```
@pw-test
```

**What it does:**
1. Runs `npx bddgen` to generate test files
2. Runs `npx playwright test`
3. Reports results with pass/fail counts
4. If failures, suggests `@pw-debug`

### Debug Failures
```
@pw-debug
```

**What it does with MCP:**
1. Parses error message for file/locator
2. Navigates to the actual page in browser
3. Inspects DOM to find correct elements
4. Updates files with fixes
5. Re-runs tests to verify

### MCP Browser Commands

```javascript
// Navigate to page
playwright.navigate({ url: "https://app.com/login" })

// Find all buttons
playwright.evaluate({ 
  expression: "Array.from(document.querySelectorAll('button')).map(b => ({text: b.textContent, id: b.id, testId: b.dataset.testid}))" 
})

// Check if element exists
playwright.locator({ selector: "#submit-btn" })

// Get element HTML
playwright.evaluate({ 
  expression: "document.querySelector('#submit-btn')?.outerHTML" 
})

// Take screenshot
playwright.screenshot({ path: "debug.png" })
```

---

## Directory Structure

```
project/
├── _source-java/           ← Your Java source files
│   ├── pages/              ← Page Objects (*.java)
│   ├── steps/              ← Step Definitions (*.java)
│   └── features/           ← Feature files (*.feature)
│
├── src/                    ← Generated TypeScript
│   ├── pages/*.page.ts     ← Converted Page Objects
│   ├── steps/*.steps.ts    ← Converted Step Definitions
│   └── fixtures.ts         ← BDD fixtures
│
├── features/               ← Copied feature files
│
├── scripts/
│   ├── migrate.js          ← Skeleton generator
│   └── verify.js           ← CoVe verification
│
├── copilot-agents/         ← Agent definitions
│   ├── pw-orchestrator.agent.md
│   ├── pw-migrate.agent.md
│   ├── pw-verify.agent.md
│   ├── pw-test.agent.md
│   └── pw-debug.agent.md
│
├── cove-report.json        ← CoVe results
├── pending-methods.json    ← Migration tracking
├── migration-status.json   ← Progress tracking
└── playwright.config.ts    ← Playwright config
```

---

## Conversion Reference

### Locators
| Selenium (Java) | Playwright (TypeScript) |
|-----------------|------------------------|
| `By.id("x")` | `locator('#x')` |
| `By.name("x")` | `locator('[name="x"]')` |
| `By.className("x")` | `locator('.x')` |
| `By.xpath("//button[text()='X']")` | `getByRole('button', { name: 'X' })` |
| `By.xpath("//input[@placeholder='X']")` | `getByPlaceholder('X')` |
| `By.xpath("//*[@data-testid='X']")` | `getByTestId('X')` |
| `@FindBy(id="x")` | `locator('#x')` |

### Actions
| Selenium (Java) | Playwright (TypeScript) |
|-----------------|------------------------|
| `element.click()` | `await element.click()` |
| `element.sendKeys("text")` | `await element.fill("text")` |
| `element.clear()` | `await element.clear()` |
| `element.getText()` | `await element.textContent()` |
| `element.getAttribute("x")` | `await element.getAttribute("x")` |
| `element.isDisplayed()` | `await element.isVisible()` |
| `element.isEnabled()` | `await element.isEnabled()` |
| `new Select(el).selectByVisibleText("x")` | `await el.selectOption({ label: "x" })` |
| `driver.get(url)` | `await page.goto(url)` |
| `Thread.sleep(1000)` | `await page.waitForTimeout(1000)` |

### Java → TypeScript
| Java | TypeScript |
|------|-----------|
| `for (Type item : list)` | `for (const item of list)` |
| `String s = "x"` | `const s = "x"` |
| `list.size()` | `list.length` |
| `list.get(0)` | `list[0]` |
| `str.equals("x")` | `str === "x"` |
| `Assert.assertTrue(x)` | `expect(x).toBeTruthy()` |
| `Assert.assertEquals(a, b)` | `expect(b).toBe(a)` |

---

## Troubleshooting

### Phase 1 Issues

**Orchestrator times out:**
```
@pw-orchestrator resume
```

**Single file fails CoVe:**
```
@pw-migrate src/pages/problematic.page.ts
npm run verify:file src/pages/problematic.page.ts
```

**Check progress:**
```
@pw-orchestrator status
```

### Phase 2 Issues

**Tests fail:**
```
@pw-debug <paste error message>
```

**Debug with live browser:**
```
@pw-debug
# Agent will use MCP to inspect actual page
```

**Run specific test:**
```
@pw-test login.feature
```

---

## NPM Scripts

```bash
# Phase 1: Migration
npm run migrate           # Create skeleton files
npm run migrate:status    # Show pending items
npm run migrate:help      # Show help

# Phase 1: CoVe Verification
npm run verify            # Run all CoVe checks
npm run verify:file <f>   # Verify single file
npm run verify:help       # Show help

# Phase 2: Test Execution
npm run bddgen            # Generate test files
npm test                  # Run all tests
npm run test:headed       # Run with visible browser
npm run test:debug        # Run with Playwright Inspector
npm run test:ui           # Run with Playwright UI
npm run report            # Show HTML report
```

---

## Summary

| Phase | Tool | Purpose | MCP Required |
|-------|------|---------|--------------|
| 1 | `npm run migrate` | Create skeletons | ❌ |
| 1 | `@pw-orchestrator` | Implement files | ❌ |
| 1 | `npm run verify` | CoVe validation | ❌ |
| 2 | `@pw-test` | Run tests | ✅ |
| 2 | `@pw-debug` | Fix failures | ✅ |

**Workflow:**
```
@pw-orchestrator start  →  npm run verify  →  @pw-test  →  @pw-debug (if needed)
```
