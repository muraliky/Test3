---
name: pw-migrate
description: Migrate a single file from Selenium/Java to Playwright/TypeScript. Use when orchestrator fails on a file or for manual fixes.
---

# MIGRATE AGENT - Single File

Implement all TODO methods in one file.

## ON "@pw-migrate <filepath>"

1. Read the file
2. Find methods with `throw new Error`
3. For each method:
   - Read `@original-java` comment
   - Convert to Playwright
   - Replace throw statement
4. Save the file
5. Report: `✅ <file> - X methods implemented`

---

## CONVERSION RULES

### Selenium → Playwright
```
element.click()           → await this.element.click()
element.sendKeys(text)    → await this.element.fill(text)
element.clear()           → await this.element.clear()
element.getText()         → await this.element.textContent()
element.getAttribute(x)   → await this.element.getAttribute(x)
element.isDisplayed()     → await this.element.isVisible()
element.isEnabled()       → await this.element.isEnabled()

new Select(e).selectByVisibleText(t) → await this.e.selectOption({label:t})
new Select(e).selectByValue(v)       → await this.e.selectOption({value:v})

driver.get(url)           → await this.page.goto(url)
driver.navigate().refresh() → await this.page.reload()
Thread.sleep(ms)          → await this.page.waitForTimeout(ms)
wait.until(visibilityOf(el)) → await this.el.waitFor({state:'visible'})
```

### Java → TypeScript
```
for (Type x : list)       → for (const x of list)
String s = "x"            → const s = "x"
list.size()               → list.length
list.get(i)               → list[i]
str.equals(x)             → str === x
str.contains(x)           → str.includes(x)
```

### Assertions
```
Assert.assertTrue(x)      → expect(x).toBeTruthy()
Assert.assertEquals(a,b)  → expect(b).toBe(a)
```
