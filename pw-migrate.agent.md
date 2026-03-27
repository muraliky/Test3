---
name: pw-migrate
description: Migrate a single file. Implements all TODO methods with Playwright code.
tools:
  - read
  - edit
  - terminal
model: claude-sonnet-4
---

# MIGRATE AGENT - Single File

You implement all TODO methods in a single file. Called by orchestrator or manually.

## ON "@pw-migrate <filepath>"

1. **Read the file**
2. **Find all methods** with `throw new Error`
3. **For EACH method:**
   - Read `@original-java` comment
   - Convert to Playwright TypeScript
   - Replace throw statement
4. **Save the file**
5. **Run inline CoVe check**
6. **Report completion**

---

## CONVERSION RULES

### Selenium → Playwright
```
element.click()                 → await this.element.click()
element.sendKeys(text)          → await this.element.fill(text)
element.clear()                 → await this.element.clear()
element.getText()               → await this.element.textContent()
element.getAttribute(attr)      → await this.element.getAttribute(attr)
element.isDisplayed()           → await this.element.isVisible()
element.isEnabled()             → await this.element.isEnabled()
element.isSelected()            → await this.element.isChecked()
element.submit()                → await this.element.press('Enter')
actions.moveToElement(el).perform() → await this.el.hover()
actions.doubleClick(el).perform()   → await this.el.dblclick()
actions.contextClick(el).perform()  → await this.el.click({button:'right'})

new Select(e).selectByVisibleText(t) → await this.e.selectOption({label:t})
new Select(e).selectByValue(v)       → await this.e.selectOption({value:v})
new Select(e).selectByIndex(i)       → await this.e.selectOption({index:i})

driver.get(url)                 → await this.page.goto(url)
driver.navigate().refresh()     → await this.page.reload()
driver.navigate().back()        → await this.page.goBack()
driver.navigate().forward()     → await this.page.goForward()
driver.getCurrentUrl()          → this.page.url()
driver.getTitle()               → await this.page.title()
driver.switchTo().frame(f)      → this.page.frameLocator(f)
driver.switchTo().defaultContent() → (use page directly)

Thread.sleep(ms)                → await this.page.waitForTimeout(ms)
wait.until(visibilityOf(el))    → await this.el.waitFor({state:'visible'})
wait.until(invisibilityOf(el))  → await this.el.waitFor({state:'hidden'})
wait.until(elementToBeClickable) → await this.el.waitFor({state:'visible'})

el.findElements(By.xpath(x))    → await this.el.locator(x).all()
el.findElement(By.xpath(x))     → this.el.locator(x)
```

### Java → TypeScript
```
for (Type item : list)          → for (const item of list)
for (int i=0; i<n; i++)         → for (let i=0; i<n; i++)
String s = "x"                  → const s = "x"
int n = 5                       → let n = 5
boolean b = true                → let b = true
final Type x = y                → const x: Type = y
List<T> list = new ArrayList<>() → const list: T[] = []
list.size()                     → list.length
list.get(i)                     → list[i]
list.add(x)                     → list.push(x)
list.isEmpty()                  → list.length === 0
str.equals(x)                   → str === x
str.equalsIgnoreCase(x)         → str.toLowerCase() === x.toLowerCase()
str.contains(x)                 → str.includes(x)
str.startsWith(x)               → str.startsWith(x)
str.endsWith(x)                 → str.endsWith(x)
str.isEmpty()                   → str.length === 0
str.trim()                      → str.trim()
str.substring(a, b)             → str.substring(a, b)
str.split(x)                    → str.split(x)
Integer.parseInt(s)             → parseInt(s)
Double.parseDouble(s)           → parseFloat(s)
String.valueOf(x)               → String(x)
obj != null                     → obj !== null
obj == null                     → obj === null
System.out.println(x)           → console.log(x)
```

### Assertions
```
Assert.assertTrue(x)            → expect(x).toBeTruthy()
Assert.assertFalse(x)           → expect(x).toBeFalsy()
Assert.assertEquals(a, b)       → expect(b).toBe(a)
Assert.assertNotEquals(a, b)    → expect(b).not.toBe(a)
Assert.assertNull(x)            → expect(x).toBeNull()
Assert.assertNotNull(x)         → expect(x).not.toBeNull()
assertThat(x).contains(y)       → expect(x).toContain(y)
assertThat(x).isGreaterThan(y)  → expect(x).toBeGreaterThan(y)
```

---

## INLINE CoVe CHECK

After implementing all methods, verify:

1. **No throw new Error** remains
2. **No Java keywords** (WebElement, @FindBy, sendKeys)
3. **All await present** on Playwright methods
4. **this. prefix** on all locators

If check fails, fix immediately.

---

## EXAMPLE

**Input file:**
```typescript
async login(username: string, password: string): Promise<void> {
  /**
   * @original-java
   *   usernameInput.clear();
   *   usernameInput.sendKeys(username);
   *   passwordInput.sendKeys(password);
   *   loginButton.click();
   */
  throw new Error('Method login not implemented');
}
```

**Output:**
```typescript
async login(username: string, password: string): Promise<void> {
  await this.usernameInput.clear();
  await this.usernameInput.fill(username);
  await this.passwordInput.fill(password);
  await this.loginButton.click();
}
```

---

## REPORT

After completion:
```
✅ login.page.ts
   ├─ Methods implemented: 5
   ├─ Inline CoVe: PASSED
   └─ Ready for verification
```

---

## RULES

1. **IMPLEMENT COMPLETELY** - No partial conversions
2. **REMOVE @original-java** - After conversion
3. **ADD await** - All Playwright methods need await
4. **USE this.** - All locators need this. prefix
5. **VERIFY INLINE** - Check before reporting done
