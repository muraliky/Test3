#!/usr/bin/env node
/**
 * Chain of Verification (CoVe) - Migration Validation
 * 
 * Verifies file migration ONLY (no test execution).
 * Test execution is handled by @pw-test with Playwright MCP.
 * 
 * USAGE:
 *   npm run verify              - Run full CoVe
 *   npm run verify:file <path>  - Verify single file
 *   npm run verify:help         - Show help
 */

const fs = require('fs');
const path = require('path');

// ═══════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════

const CONFIG = {
  sourceDir: './_source-java',
  pagesOut: './src/pages',
  stepsOut: './src/steps',
  reportFile: './cove-report.json',
};

// ═══════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════

function getAllFiles(dir, extension) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results = results.concat(getAllFiles(fullPath, extension));
    } else if (item.endsWith(extension)) {
      results.push(fullPath);
    }
  }
  return results;
}

// ═══════════════════════════════════════════════════════════════
// CoVe CHECK 1: STRUCTURE
// ═══════════════════════════════════════════════════════════════

function checkStructure(filePath, content, isPage) {
  const issues = [];
  
  if (isPage) {
    // Page file checks
    if (!content.includes('export class')) {
      issues.push({ severity: 'error', message: 'Missing class export' });
    }
    if (!content.includes('constructor(page: Page)') && !content.includes('constructor(private page: Page)')) {
      issues.push({ severity: 'error', message: 'Missing constructor with Page' });
    }
    if (!content.includes('readonly page: Page') && !content.includes('private page: Page')) {
      issues.push({ severity: 'warning', message: 'Missing page property' });
    }
  } else {
    // Step file checks
    if (!content.includes("import { Given") && !content.includes("import { When") && !content.includes("import {Given")) {
      issues.push({ severity: 'error', message: 'Missing BDD imports' });
    }
  }
  
  // Common checks - Java syntax
  const javaPatterns = [
    { pattern: 'public void', msg: 'public void' },
    { pattern: 'private void', msg: 'private void' },
    { pattern: 'WebElement', msg: 'WebElement' },
    { pattern: 'WebDriver', msg: 'WebDriver' },
    { pattern: '@FindBy', msg: '@FindBy annotation' },
    { pattern: 'By.xpath(', msg: 'By.xpath()' },
    { pattern: 'By.id(', msg: 'By.id()' },
    { pattern: 'By.name(', msg: 'By.name()' },
    { pattern: 'By.className(', msg: 'By.className()' },
    { pattern: 'By.cssSelector(', msg: 'By.cssSelector()' },
    { pattern: '.sendKeys(', msg: '.sendKeys() - use .fill()' },
    { pattern: '.getText()', msg: '.getText() - use .textContent()' },
    { pattern: '.isDisplayed()', msg: '.isDisplayed() - use .isVisible()' },
    { pattern: 'Thread.sleep', msg: 'Thread.sleep' },
    { pattern: 'driver.get(', msg: 'driver.get()' },
    { pattern: 'driver.findElement', msg: 'driver.findElement' },
    { pattern: '@Given(', msg: '@Given annotation' },
    { pattern: '@When(', msg: '@When annotation' },
    { pattern: '@Then(', msg: '@Then annotation' },
    { pattern: '@And(', msg: '@And annotation' },
  ];
  
  for (const jp of javaPatterns) {
    if (content.includes(jp.pattern)) {
      issues.push({ severity: 'error', message: `Java syntax: ${jp.msg}` });
    }
  }
  
  return {
    name: 'Structure',
    passed: !issues.some(i => i.severity === 'error'),
    issues,
  };
}

// ═══════════════════════════════════════════════════════════════
// CoVe CHECK 2: IMPLEMENTATION
// ═══════════════════════════════════════════════════════════════

function checkImplementation(filePath, content) {
  const issues = [];
  
  // Check for TODO markers
  const todoMatches = content.match(/throw new Error\(['"](Method|Step).*not implemented/g);
  if (todoMatches) {
    issues.push({ 
      severity: 'error', 
      message: `${todoMatches.length} TODO(s) not implemented`,
    });
  }
  
  // Check for await on Playwright methods
  const lines = content.split('\n');
  const playwrightMethods = [
    '.click()', '.fill(', '.clear()', '.hover()', '.focus()', 
    '.press(', '.selectOption(', '.check()', '.uncheck()', 
    '.waitFor(', '.goto(', '.reload(', '.goBack()', '.goForward(',
    '.textContent()', '.innerText()', '.getAttribute(',
    '.isVisible()', '.isEnabled()', '.isChecked(',
    '.scrollIntoViewIfNeeded()', '.dblclick()', '.type(',
    '.screenshot(', '.evaluate(',
  ];
  
  let awaitIssues = 0;
  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('*')) return;
    
    for (const method of playwrightMethods) {
      if (line.includes(method) && 
          !line.includes('await') && 
          !line.includes('return ') &&
          !trimmed.startsWith('//')) {
        awaitIssues++;
      }
    }
  });
  
  if (awaitIssues > 0) {
    issues.push({ 
      severity: 'warning', 
      message: `${awaitIssues} potential missing await(s)`,
    });
  }
  
  return {
    name: 'Implementation',
    passed: !issues.some(i => i.severity === 'error'),
    issues,
  };
}

// ═══════════════════════════════════════════════════════════════
// CoVe CHECK 3: COUNT MATCH
// ═══════════════════════════════════════════════════════════════

function checkCountMatch(tsFilePath, tsContent) {
  const issues = [];
  
  // Find source reference
  const sourceMatch = tsContent.match(/@source\s+([^\n\r]+)/);
  if (!sourceMatch) {
    return { name: 'Count Match', passed: true, issues: [], skipped: true };
  }
  
  const javaPath = sourceMatch[1].trim();
  if (!fs.existsSync(javaPath)) {
    return { name: 'Count Match', passed: true, issues: [], skipped: true };
  }
  
  const javaContent = fs.readFileSync(javaPath, 'utf-8');
  
  // Count locators
  const javaLocators = (javaContent.match(/@FindBy|By\.\w+\s*\(|private\s+WebElement/g) || []).length;
  const tsLocators = (tsContent.match(/readonly\s+\w+:\s*Locator/g) || []).length;
  
  if (javaLocators > 0 && tsLocators > 0 && Math.abs(javaLocators - tsLocators) > 2) {
    issues.push({
      severity: 'warning',
      message: `Locators: Java=${javaLocators}, TS=${tsLocators}`,
    });
  }
  
  // Count methods
  const javaClass = javaContent.match(/class\s+(\w+)/)?.[1] || '';
  const javaMethods = (javaContent.match(/public\s+\w+\s+(\w+)\s*\(/g) || [])
    .filter(m => !m.includes(javaClass)).length;
  const tsMethods = (tsContent.match(/async\s+\w+\s*\([^)]*\):\s*Promise/g) || []).length;
  
  if (javaMethods > 0 && tsMethods > 0 && Math.abs(javaMethods - tsMethods) > 2) {
    issues.push({
      severity: 'warning',
      message: `Methods: Java=${javaMethods}, TS=${tsMethods}`,
    });
  }
  
  return {
    name: 'Count Match',
    passed: true,
    issues,
  };
}

// ═══════════════════════════════════════════════════════════════
// CoVe CHECK 4: SYNTAX
// ═══════════════════════════════════════════════════════════════

function checkSyntax(filePath, content) {
  const issues = [];
  
  // Balanced braces
  const openBraces = (content.match(/\{/g) || []).length;
  const closeBraces = (content.match(/\}/g) || []).length;
  if (openBraces !== closeBraces) {
    issues.push({ severity: 'error', message: `Unbalanced braces: {=${openBraces}, }=${closeBraces}` });
  }
  
  // Balanced parentheses
  const openParens = (content.match(/\(/g) || []).length;
  const closeParens = (content.match(/\)/g) || []).length;
  if (openParens !== closeParens) {
    issues.push({ severity: 'error', message: `Unbalanced parens: (=${openParens}, )=${closeParens}` });
  }
  
  // Double keywords
  if (/async\s+async/.test(content)) {
    issues.push({ severity: 'error', message: 'Double async keyword' });
  }
  if (/await\s+await/.test(content)) {
    issues.push({ severity: 'error', message: 'Double await keyword' });
  }
  
  return {
    name: 'Syntax',
    passed: !issues.some(i => i.severity === 'error'),
    issues,
  };
}

// ═══════════════════════════════════════════════════════════════
// VERIFY SINGLE FILE
// ═══════════════════════════════════════════════════════════════

function verifyFile(filePath, silent = false) {
  const fileName = path.basename(filePath);
  
  if (!fs.existsSync(filePath)) {
    if (!silent) console.log(`   ❌ ${fileName} - File not found`);
    return { passed: false, error: 'File not found' };
  }
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const isPage = filePath.includes('.page.ts');
  
  if (!silent) console.log(`\n   📄 ${fileName}`);
  
  // Run all checks
  const checks = [
    checkStructure(filePath, content, isPage),
    checkImplementation(filePath, content),
    checkCountMatch(filePath, content),
    checkSyntax(filePath, content),
  ];
  
  if (!silent) {
    for (const check of checks) {
      const icon = check.passed ? '✓' : '✗';
      console.log(`      ├─ ${check.name}... ${icon}`);
    }
  }
  
  const hasError = checks.some(c => !c.passed);
  const warningCount = checks.reduce((sum, c) => 
    sum + c.issues.filter(i => i.severity === 'warning').length, 0);
  
  if (!silent) {
    if (!hasError && warningCount === 0) {
      console.log('      └─ ✅ PASSED');
    } else if (!hasError) {
      console.log(`      └─ ⚠️ PASSED (${warningCount} warning${warningCount > 1 ? 's' : ''})`);
    } else {
      console.log('      └─ ❌ FAILED');
      for (const check of checks) {
        const errors = check.issues.filter(i => i.severity === 'error');
        for (const err of errors) {
          console.log(`         • ${err.message}`);
        }
      }
    }
  }
  
  return {
    passed: !hasError,
    checks,
    warnings: warningCount,
  };
}

// ═══════════════════════════════════════════════════════════════
// RUN FULL CoVe
// ═══════════════════════════════════════════════════════════════

function runFullVerification() {
  console.log('\n');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('              CHAIN OF VERIFICATION (CoVe)');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
  console.log('   Checks: Structure | Implementation | Count Match | Syntax');
  console.log('   (Test execution handled by @pw-test with Playwright MCP)');
  
  // Get files
  const pageFiles = getAllFiles(CONFIG.pagesOut, '.page.ts');
  const stepFiles = getAllFiles(CONFIG.stepsOut, '.steps.ts')
    .filter(f => !f.includes('fixtures.ts'));
  const allFiles = [...pageFiles, ...stepFiles];
  
  if (allFiles.length === 0) {
    console.log('\n   ⚠️ No files to verify. Run: npm run migrate');
    return;
  }
  
  console.log(`\n   Found ${allFiles.length} files to verify`);
  console.log(`   ├─ ${pageFiles.length} page files`);
  console.log(`   └─ ${stepFiles.length} step files`);
  
  console.log('\n───────────────────────────────────────────────────────────────');
  console.log('   VERIFICATION RESULTS');
  console.log('───────────────────────────────────────────────────────────────');
  
  let passedCount = 0;
  let failedCount = 0;
  let totalWarnings = 0;
  const failedFiles = [];
  const report = {
    timestamp: new Date().toISOString(),
    status: 'pending',
    files: {},
    summary: {},
  };
  
  for (const file of allFiles) {
    const result = verifyFile(file);
    report.files[file] = result;
    
    if (result.passed) {
      passedCount++;
      totalWarnings += result.warnings || 0;
    } else {
      failedCount++;
      failedFiles.push(path.basename(file));
    }
  }
  
  // Summary
  console.log('\n');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('                     CoVe SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
  console.log(`   Files Verified:  ${allFiles.length}`);
  console.log(`   ├─ Passed:       ${passedCount} ✅`);
  console.log(`   ├─ Failed:       ${failedCount} ❌`);
  console.log(`   └─ Warnings:     ${totalWarnings} ⚠️`);
  console.log('');
  
  report.status = failedCount === 0 ? 'passed' : 'failed';
  report.summary = {
    totalFiles: allFiles.length,
    passedFiles: passedCount,
    failedFiles: failedCount,
    warnings: totalWarnings,
    failedFileNames: failedFiles,
  };
  
  fs.writeFileSync(CONFIG.reportFile, JSON.stringify(report, null, 2));
  
  if (failedCount === 0) {
    console.log('   ═══════════════════════════════════════════════════════════');
    console.log('   ✅ ALL FILES VERIFIED - Ready for test execution');
    console.log('   ═══════════════════════════════════════════════════════════');
    console.log('');
    console.log('   Next: Run tests with Playwright MCP');
    console.log('         @pw-test');
  } else {
    console.log('   ═══════════════════════════════════════════════════════════');
    console.log('   ❌ VERIFICATION FAILED');
    console.log('   ═══════════════════════════════════════════════════════════');
    console.log('');
    console.log('   Failed files:');
    failedFiles.forEach(f => console.log(`     • ${f}`));
    console.log('');
    console.log('   Fix with: @pw-migrate <filename>');
  }
  
  console.log('');
  console.log(`   Report: ${CONFIG.reportFile}`);
  console.log('');
}

// ═══════════════════════════════════════════════════════════════
// CLI
// ═══════════════════════════════════════════════════════════════

const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'file':
    if (args[1]) {
      verifyFile(args[1]);
    } else {
      console.log('Usage: npm run verify:file <filepath>');
    }
    break;
    
  case 'help':
    console.log(`
Chain of Verification (CoVe)

Commands:
  npm run verify              - Run full CoVe on all files
  npm run verify:file <path>  - Verify single file
  npm run verify:help         - Show this help

Checks performed:
  1. Structure      - Class, imports, no Java syntax
  2. Implementation - No TODOs, async/await usage
  3. Count Match    - Locators/methods match source
  4. Syntax         - Balanced braces, no obvious errors

Note: Test execution is handled by @pw-test with Playwright MCP.
`);
    break;
    
  default:
    runFullVerification();
}
