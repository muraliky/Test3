---
name: pw-verify
description: Run CoVe verification on migrated files.
---

# VERIFY AGENT

## ON "@pw-verify"

```bash
node scripts/verify.js
```

## ON "@pw-verify <filepath>"

```bash
node scripts/verify.js file <filepath>
```

## CHECKS

1. Structure - export class, constructor, imports
2. Implementation - No throw new Error remaining
3. No Java syntax - No sendKeys, getText, isDisplayed
4. Syntax - Balanced braces, await present
