# Selenium to Playwright-BDD Migration Toolkit

## Hybrid Approach: Node.js + Copilot Agents

This toolkit uses a **3-phase hybrid approach** to avoid Copilot timeout issues:

| Phase | Tool | What It Does | Time |
|-------|------|--------------|------|
| 1 | Node.js | Creates skeleton files with TODO markers | ~1 min |
| 2 | Copilot Agent | Implements method logic (one file at a time) | ~2-3 min/file |
| 3 | Copilot Agent | Fixes failing tests | As needed |

---

## Quick Start

```bash
# 1. Setup
./setup.sh        # Mac/Linux
setup.bat         # Windows

# 2. Phase 1: Create skeletons
npm run migrate

# 3. Phase 2: Implement methods (in VS Code)
# Open Copilot Chat: Ctrl+Shift+I
@pw-implement src/pages/login.page.ts

# 4. Phase 3: Fix tests
npm test
@pw-debug <paste error>
```

---

## Phase 1: Node.js Migration (Skeleton)

Creates TypeScript files with:
- ✅ Class structure
- ✅ Locators (converted from XPath)
- ✅ Method signatures with JSDoc
- ❌ Method body = TODO + Original Java as comment

### Command
```bash
npm run migrate
```

### Output Example

**Original Java:**
```java
public class LoginPage {
    @FindBy(id = "username")
    private WebElement usernameInput;
    
    public void login(String username, String password) {
        usernameInput.clear();
        usernameInput.sendKeys(username);
        passwordInput.sendKeys(password);
        loginButton.click();
    }
}
```

**Generated TypeScript (Skeleton):**
```typescript
export class LoginPage {
  readonly page: Page;
  readonly usernameInput: Locator;
  
  constructor(page: Page) {
    this.page = page;
    this.usernameInput = page.locator('#username');
  }
  
  /**
   * login
   * @original-java
   *   usernameInput.clear();
   *   usernameInput.sendKeys(username);
   *   passwordInput.sendKeys(password);
   *   loginButton.click();
   */
  async login(username: string, password: string): Promise<void> {
    // TODO: @pw-implement
    throw new Error('Method login not implemented');
  }
}
```

---

## Phase 2: Copilot Agent (@pw-implement)

Implements the TODO methods one file at a time.

### Usage
```
@pw-implement src/pages/login.page.ts
```

### What It Does
1. Reads the TypeScript file
2. Finds methods with `throw new Error`
3. Reads the @original-java comment
4. Implements the method using Playwright
5. Moves to next method

### Output Example
```typescript
async login(username: string, password: string): Promise<void> {
  await this.usernameInput.clear();
  await this.usernameInput.fill(username);
  await this.passwordInput.fill(password);
  await this.loginButton.click();
}
```

### Why This Doesn't Timeout
- One file at a time
- Method logic is focused
- Small response = fast completion

---

## Phase 3: Debug Agent (@pw-debug)

Fixes failing tests.

### Usage
```
@pw-debug Error: locator('#submit-btn') - no element found at line 25
```

### What It Does
1. Analyzes the error
2. Reads the file
3. Identifies the issue
4. Suggests and applies fix

### Common Fixes
| Error | Fix |
|-------|-----|
| Element not found | Update locator |
| Timeout | Add explicit wait |
| Multiple elements | Use `.first()` or more specific selector |
| Element in iframe | Use `frameLocator()` |

---

## Available Agents

| Agent | Purpose | Usage |
|-------|---------|-------|
| `@pw-implement` | Implement TODO methods | `@pw-implement <file.ts>` |
| `@pw-debug` | Fix failing tests | `@pw-debug <error message>` |
| `@pw-status` | Show pending TODOs | `@pw-status` |

---

## Directory Structure

```
project/
├── _source-java/           ← Your Java files (input)
│   ├── pages/
│   ├── steps/
│   └── features/
├── src/                    ← Generated TypeScript (output)
│   ├── pages/
│   │   └── login.page.ts   ← Skeleton with TODOs
│   └── steps/
│       ├── fixtures.ts     ← Auto-generated
│       └── login.steps.ts  ← Skeleton with TODOs
├── features/               ← Copied feature files
├── copilot-agents/         ← Agent definitions
├── .github/agents/         ← Agents for VS Code
├── pending-methods.json    ← Tracks TODOs
└── playwright.config.ts    ← Auto-generated
```

---

## Commands

| Command | Description |
|---------|-------------|
| `npm run migrate` | Phase 1: Create skeleton files |
| `npm run migrate:status` | Show pending implementations |
| `npm test` | Run Playwright tests |
| `npm run test:headed` | Run with browser visible |
| `npm run test:debug` | Run in debug mode |

---

## Conversion Reference

### Locators
| Selenium | Playwright |
|----------|-----------|
| `By.id("x")` | `locator('#x')` |
| `By.xpath("//button[text()='X']")` | `getByRole('button', { name: 'X' })` |
| `By.cssSelector(".btn")` | `locator('.btn')` |
| `@FindBy(id="x")` | `locator('#x')` |

### Actions
| Selenium | Playwright |
|----------|-----------|
| `element.click()` | `await element.click()` |
| `element.sendKeys("text")` | `await element.fill("text")` |
| `element.getText()` | `await element.textContent()` |
| `element.isDisplayed()` | `await element.isVisible()` |

---

## Why Hybrid Approach?

| Problem with Pure Agent | Solution |
|------------------------|----------|
| Timeout on large files | Node.js handles structure |
| Network reset | Small focused tasks |
| Keeps thinking forever | Agent only implements logic |
| Firewall blocks | Most work done locally |

**Result:** Reliable migration without timeouts!
