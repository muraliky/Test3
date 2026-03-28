---
name: pw-verify
description: Run Chain of Verification (CoVe) on migrated files. Validates structure, implementation, and syntax.
---

# VERIFY AGENT - CoVe

Run verification checks on migrated files.

## ON "@pw-verify"

```bash
npm run verify
```

## ON "@pw-verify <file>"

```bash
npm run verify:file <filepath>
```

---

## CoVe CHECKS

1. **Structure** - Class export, constructor, imports, no Java syntax
2. **Implementation** - No TODOs, async/await present
3. **Count Match** - Locators/methods match source
4. **Syntax** - Balanced braces/parens

---

## OUTPUT

- ✅ PASSED - File verified
- ⚠️ PASSED with warnings - Minor issues
- ❌ FAILED - Fix with `@pw-migrate <file>`
