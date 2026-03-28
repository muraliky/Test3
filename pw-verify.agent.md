---
name: pw-verify
description: Standalone helper to run CoVe verification. Use to validate migrated files.
---

# VERIFY AGENT (Standalone Helper)

Run verification checks on migrated files.

---

## ON "@pw-verify"

```bash
node scripts/verify.js
```

---

## ON "@pw-verify <filepath>"

```bash
node scripts/verify.js file <filepath>
```

---

## CoVe CHECKS

1. **Structure** - export class, constructor, imports
2. **Implementation** - No throw new Error remaining
3. **No Java** - No sendKeys, getText, isDisplayed
4. **Syntax** - Balanced braces, await present

---

## OUTPUT

- ✅ PASSED
- ⚠️ PASSED with warnings
- ❌ FAILED → Fix with `@pw-migrate <file>`
