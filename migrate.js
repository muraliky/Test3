#!/usr/bin/env node
/**
 * Selenium to Playwright-BDD Migration Script
 * Creates SKELETON files with TODO markers.
 * Method implementation is done by worker agents.
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  sourceDir: './_source-java',
  pagesOut: './src/pages',
  stepsOut: './src/steps',
  featuresOut: './features',
  pendingFile: './pending-methods.json',
};

// Track pending implementations
let pending = {
  pages: {},
  steps: {},
  pageFiles: [],
  stepFiles: [],
  totalMethods: 0,
  totalSteps: 0,
};

// ═══════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════

function toKebabCase(str) {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').replace(/([A-Z])([A-Z][a-z])/g, '$1-$2').toLowerCase();
}

function toCamelCase(str) {
  return str.charAt(0).toLowerCase() + str.slice(1);
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function getAllFiles(dir, ext) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item);
    if (fs.statSync(full).isDirectory()) {
      results = results.concat(getAllFiles(full, ext));
    } else if (item.endsWith(ext)) {
      results.push(full);
    }
  }
  return results;
}

// ═══════════════════════════════════════════════════════════════
// LOCATOR CONVERSION
// ═══════════════════════════════════════════════════════════════

function convertLocator(loc) {
  let m;
  
  // Button with text
  if ((m = loc.match(/\/\/button\[text\(\)\s*=\s*['"]([^'"]+)['"]\]/))) 
    return `getByRole('button', { name: '${m[1]}' })`;
  if ((m = loc.match(/\/\/button\[contains\(text\(\),\s*['"]([^'"]+)['"]\)\]/)))
    return `getByRole('button', { name: /${m[1]}/i })`;
  
  // Link
  if ((m = loc.match(/\/\/a\[text\(\)\s*=\s*['"]([^'"]+)['"]\]/)))
    return `getByRole('link', { name: '${m[1]}' })`;
  
  // Input placeholder
  if ((m = loc.match(/\/\/input\[@placeholder\s*=\s*['"]([^'"]+)['"]\]/)))
    return `getByPlaceholder('${m[1]}')`;
  
  // Label
  if ((m = loc.match(/\/\/label\[text\(\)\s*=\s*['"]([^'"]+)['"]\]/)))
    return `getByLabel('${m[1]}')`;
  
  // Data-testid
  if ((m = loc.match(/\/\/\*\[@data-testid\s*=\s*['"]([^'"]+)['"]\]/)))
    return `getByTestId('${m[1]}')`;
  
  // ID in xpath
  if ((m = loc.match(/\/\/\w*\[@id\s*=\s*['"]([^'"]+)['"]\]/)))
    return `locator('#${m[1]}')`;
  
  // By.id
  if ((m = loc.match(/By\.id\s*\(\s*["']([^'"]+)["']\s*\)/)))
    return `locator('#${m[1]}')`;
  
  // By.name
  if ((m = loc.match(/By\.name\s*\(\s*["']([^'"]+)["']\s*\)/)))
    return `locator('[name="${m[1]}"]')`;
  
  // By.className
  if ((m = loc.match(/By\.className\s*\(\s*["']([^'"]+)["']\s*\)/)))
    return `locator('.${m[1]}')`;
  
  // By.cssSelector
  if ((m = loc.match(/By\.cssSelector\s*\(\s*["']([^'"]+)["']\s*\)/)))
    return `locator('${m[1]}')`;
  
  // By.xpath
  if ((m = loc.match(/By\.xpath\s*\(\s*["']([^'"]+)["']\s*\)/)))
    return `locator('${m[1]}')`;
  
  // XPath fallback
  if (loc.startsWith('//'))
    return `locator('${loc}')`;
  
  return `locator('${loc}')`;
}

// ═══════════════════════════════════════════════════════════════
// TYPE CONVERSION
// ═══════════════════════════════════════════════════════════════

function javaToTsType(t) {
  const map = { 'String': 'string', 'int': 'number', 'Integer': 'number', 'long': 'number', 'double': 'number', 'boolean': 'boolean', 'void': 'void', 'List': 'any[]', 'WebElement': 'Locator' };
  return map[t] || 'unknown';
}

function convertParams(params) {
  if (!params.trim()) return { params: '', docs: '' };
  const result = { params: [], docs: [] };
  for (const p of params.split(',').map(x => x.trim())) {
    const parts = p.split(/\s+/);
    if (parts.length >= 2) {
      const tsType = javaToTsType(parts[0]);
      const name = parts[parts.length - 1];
      result.params.push(`${name}: ${tsType}`);
      result.docs.push(`   * @param {${tsType}} ${name}`);
    }
  }
  return { params: result.params.join(', '), docs: result.docs.join('\n') };
}

// ═══════════════════════════════════════════════════════════════
// PARSE JAVA PAGE
// ═══════════════════════════════════════════════════════════════

function parseJavaPage(content, fileName) {
  const result = { className: '', locators: [], methods: [] };
  
  // Class name
  const cm = content.match(/public\s+class\s+(\w+)/);
  result.className = cm ? cm[1] : fileName.replace('.java', '');
  
  // @FindBy locators
  const findByRe = /@FindBy\s*\(\s*(\w+)\s*=\s*["']([^'"]+)["']\s*\)\s*(?:public|private|protected)?\s*\w+\s+(\w+)\s*;/g;
  let m;
  while ((m = findByRe.exec(content))) {
    const [, type, val, name] = m;
    let conv;
    if (type === 'xpath') conv = convertLocator(val);
    else if (type === 'id') conv = `locator('#${val}')`;
    else if (type === 'name') conv = `locator('[name="${val}"]')`;
    else if (type === 'className' || type === 'css') conv = `locator('.${val}')`;
    else conv = `locator('${val}')`;
    result.locators.push({ name, original: `${type}="${val}"`, converted: conv });
  }
  
  // By locators
  const byRe = /(?:private|public|protected)?\s*By\s+(\w+)\s*=\s*(By\.\w+\s*\([^)]+\))\s*;/g;
  while ((m = byRe.exec(content))) {
    result.locators.push({ name: m[1], original: m[2], converted: convertLocator(m[2]) });
  }
  
  // Methods
  const methodRe = /public\s+(\w+)\s+(\w+)\s*\(([^)]*)\)\s*(?:throws\s+\w+)?\s*\{([\s\S]*?)\n\s{0,4}\}/g;
  while ((m = methodRe.exec(content))) {
    const [, ret, name, params, body] = m;
    if (name === result.className) continue; // Skip constructor
    result.methods.push({ name, returnType: ret, params: params.trim(), body: body.trim() });
  }
  
  return result;
}

// ═══════════════════════════════════════════════════════════════
// GENERATE SKELETON PAGE
// ═══════════════════════════════════════════════════════════════

function generateSkeletonPage(parsed, javaFile) {
  const kebab = toKebabCase(parsed.className.replace(/Page$/, ''));
  const methods = [];

  let out = `/**
 * @fileoverview ${parsed.className}
 * @source ${javaFile}
 */

import { Page, Locator, expect } from '@playwright/test';

export class ${parsed.className} {
  readonly page: Page;
`;

  // Locators
  for (const loc of parsed.locators) {
    out += `  /** @original ${loc.original} */\n`;
    out += `  readonly ${loc.name}: Locator;\n`;
  }

  // Constructor
  out += `\n  constructor(page: Page) {\n    this.page = page;\n`;
  for (const loc of parsed.locators) {
    out += `    this.${loc.name} = page.${loc.converted};\n`;
  }
  out += `  }\n`;

  // Methods - SKELETON
  for (const method of parsed.methods) {
    methods.push(method.name);
    const tp = convertParams(method.params);
    const ret = javaToTsType(method.returnType);
    const bodyLines = method.body.split('\n').map(l => `   *   ${l.trim()}`).join('\n');

    out += `
  /**
   * ${method.name}
   * @original-java
${bodyLines}
${tp.docs ? tp.docs + '\n' : ''}   * @returns {Promise<${ret}>}
   */
  async ${method.name}(${tp.params}): Promise<${ret}> {
    throw new Error('Method ${method.name} not implemented');
  }
`;
  }

  out += `}\n`;
  return { content: out, fileName: `${kebab}.page.ts`, methods };
}

// ═══════════════════════════════════════════════════════════════
// PARSE JAVA STEPS
// ═══════════════════════════════════════════════════════════════

function parseJavaSteps(content, fileName) {
  const result = { className: '', steps: [] };
  const cm = content.match(/public\s+class\s+(\w+)/);
  result.className = cm ? cm[1] : fileName.replace('.java', '');

  const stepRe = /@(Given|When|Then|And|But)\s*\(\s*["']([^'"]+)["']\s*\)\s*public\s+void\s+(\w+)\s*\(([^)]*)\)\s*(?:throws\s+\w+)?\s*\{([\s\S]*?)\n\s{0,4}\}/g;
  let m;
  while ((m = stepRe.exec(content))) {
    let [, ann, text, name, params, body] = m;
    // Convert And/But
    if (ann === 'And' || ann === 'But') {
      const lower = text.toLowerCase();
      if (lower.includes('click') || lower.includes('enter') || lower.includes('select') || lower.includes('type'))
        ann = 'When';
      else if (lower.includes('should') || lower.includes('verify') || lower.includes('see') || lower.includes('displayed'))
        ann = 'Then';
      else
        ann = 'Given';
    }
    result.steps.push({ annotation: ann, stepText: text, methodName: name, params: params.trim(), body: body.trim() });
  }
  return result;
}

// ═══════════════════════════════════════════════════════════════
// GENERATE SKELETON STEPS
// ═══════════════════════════════════════════════════════════════

function generateSkeletonSteps(parsed, javaFile) {
  const kebab = toKebabCase(parsed.className.replace(/Steps?$/, ''));
  const steps = [];

  let out = `/**
 * @fileoverview ${parsed.className}
 * @source ${javaFile}
 */

import { Given, When, Then, expect } from './fixtures';

`;

  for (const step of parsed.steps) {
    steps.push(step.stepText);
    const tp = convertParams(step.params);
    const bodyLines = step.body.split('\n').map(l => ` *   ${l.trim()}`).join('\n');

    // Detect fixtures needed
    const fixtures = ['page'];
    const pageRefs = step.body.match(/(\w+)Page\./g) || [];
    pageRefs.forEach(p => {
      const name = toCamelCase(p.replace('.', ''));
      if (!fixtures.includes(name)) fixtures.push(name);
    });

    out += `/**
 * @step ${step.annotation}: ${step.stepText}
 * @original-java
${bodyLines}
 */
${step.annotation}('${step.stepText}', async ({ ${fixtures.join(', ')} }${tp.params ? `, ${tp.params}` : ''}) => {
  throw new Error('Step not implemented');
});

`;
  }

  return { content: out, fileName: `${kebab}.steps.ts`, steps };
}

// ═══════════════════════════════════════════════════════════════
// GENERATE FIXTURES
// ═══════════════════════════════════════════════════════════════

function generateFixtures() {
  const pageFiles = getAllFiles(CONFIG.pagesOut, '.page.ts');
  let imports = '', types = '', impl = '';

  for (const pf of pageFiles) {
    const fn = path.basename(pf, '.page.ts');
    const cn = fn.split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('') + 'Page';
    const fix = toCamelCase(cn);
    imports += `import { ${cn} } from '../pages/${fn}.page';\n`;
    types += `  ${fix}: ${cn};\n`;
    impl += `  ${fix}: async ({ page }, use) => { await use(new ${cn}(page)); },\n`;
  }

  return `/**
 * @fileoverview Playwright-BDD Fixtures
 */

import { test as base, createBdd } from 'playwright-bdd';

${imports}
type Fixtures = {
${types}};

export const test = base.extend<Fixtures>({
${impl}});

export const { Given, When, Then } = createBdd(test);
export { expect } from '@playwright/test';
`;
}

// ═══════════════════════════════════════════════════════════════
// GENERATE CONFIG
// ═══════════════════════════════════════════════════════════════

function generateConfig() {
  return `import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig, cucumberReporter } from 'playwright-bdd';

const testDir = defineBddConfig({
  features: 'features/**/*.feature',
  steps: 'src/steps/**/*.ts',
});

export default defineConfig({
  testDir,
  timeout: 30000,
  retries: process.env.CI ? 2 : 0,
  reporter: [['html'], ['list'], cucumberReporter('html', { outputFile: 'cucumber-report/report.html' })],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
`;
}

// ═══════════════════════════════════════════════════════════════
// MIGRATION
// ═══════════════════════════════════════════════════════════════

function migratePages() {
  console.log('\n📄 Migrating Pages...\n');
  const pagesDir = path.join(CONFIG.sourceDir, 'pages');
  const files = getAllFiles(pagesDir, '.java');
  if (!files.length) { console.log('   No page files found'); return; }

  ensureDir(CONFIG.pagesOut);
  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf-8');
      const parsed = parseJavaPage(content, path.basename(file));
      const result = generateSkeletonPage(parsed, file);
      
      const rel = path.relative(pagesDir, path.dirname(file));
      const outDir = path.join(CONFIG.pagesOut, rel);
      ensureDir(outDir);
      
      const outPath = path.join(outDir, result.fileName);
      fs.writeFileSync(outPath, result.content);
      
      const relPath = path.join(CONFIG.pagesOut, rel, result.fileName).replace(/\\/g, '/');
      pending.pages[result.fileName] = result.methods;
      pending.pageFiles.push(relPath);
      pending.totalMethods += result.methods.length;
      
      console.log(`   ✅ ${path.basename(file)} → ${result.fileName} (${result.methods.length} methods)`);
    } catch (e) {
      console.log(`   ❌ ${path.basename(file)}: ${e.message}`);
    }
  }
}

function migrateSteps() {
  console.log('\n📝 Migrating Steps...\n');
  const stepsDir = path.join(CONFIG.sourceDir, 'steps');
  const files = getAllFiles(stepsDir, '.java');
  if (!files.length) { console.log('   No step files found'); return; }

  ensureDir(CONFIG.stepsOut);
  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf-8');
      const parsed = parseJavaSteps(content, path.basename(file));
      const result = generateSkeletonSteps(parsed, file);
      
      const rel = path.relative(stepsDir, path.dirname(file));
      const outDir = path.join(CONFIG.stepsOut, rel);
      ensureDir(outDir);
      
      const outPath = path.join(outDir, result.fileName);
      fs.writeFileSync(outPath, result.content);
      
      const relPath = path.join(CONFIG.stepsOut, rel, result.fileName).replace(/\\/g, '/');
      pending.steps[result.fileName] = result.steps;
      pending.stepFiles.push(relPath);
      pending.totalSteps += result.steps.length;
      
      console.log(`   ✅ ${path.basename(file)} → ${result.fileName} (${result.steps.length} steps)`);
    } catch (e) {
      console.log(`   ❌ ${path.basename(file)}: ${e.message}`);
    }
  }
}

function copyFeatures() {
  console.log('\n📋 Copying Features...\n');
  const featDir = path.join(CONFIG.sourceDir, 'features');
  const files = getAllFiles(featDir, '.feature');
  if (!files.length) { console.log('   No feature files found'); return; }

  ensureDir(CONFIG.featuresOut);
  for (const file of files) {
    const rel = path.relative(featDir, file);
    const out = path.join(CONFIG.featuresOut, rel);
    ensureDir(path.dirname(out));
    fs.copyFileSync(file, out);
    console.log(`   ✅ ${path.basename(file)}`);
  }
}

function generateSupport() {
  console.log('\n🔧 Generating Support Files...\n');
  ensureDir(CONFIG.stepsOut);
  
  fs.writeFileSync(path.join(CONFIG.stepsOut, 'fixtures.ts'), generateFixtures());
  console.log('   ✅ fixtures.ts');
  
  fs.writeFileSync('playwright.config.ts', generateConfig());
  console.log('   ✅ playwright.config.ts');
  
  fs.writeFileSync(CONFIG.pendingFile, JSON.stringify(pending, null, 2));
  console.log(`   ✅ ${CONFIG.pendingFile}`);
}

function runMigration() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('         SELENIUM TO PLAYWRIGHT-BDD MIGRATION (Skeleton)');
  console.log('═══════════════════════════════════════════════════════════════');

  migratePages();
  migrateSteps();
  copyFeatures();
  generateSupport();

  const totalFiles = pending.pageFiles.length + pending.stepFiles.length;
  
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('                    SKELETON GENERATION COMPLETE');
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log(`   Files Created:   ${totalFiles}`);
  console.log(`   ├─ Pages:        ${pending.pageFiles.length} (${pending.totalMethods} methods)`);
  console.log(`   └─ Steps:        ${pending.stepFiles.length} (${pending.totalSteps} steps)`);
  console.log('\n   Next: Initialize work queue');
  console.log('         node scripts/queue.js init');
  console.log('\n═══════════════════════════════════════════════════════════════\n');
}

function showStatus() {
  if (!fs.existsSync(CONFIG.pendingFile)) {
    console.log('No pending-methods.json found. Run: npm run migrate');
    return;
  }
  const p = JSON.parse(fs.readFileSync(CONFIG.pendingFile, 'utf-8'));
  console.log('\nPending files:', p.pageFiles.length + p.stepFiles.length);
  console.log('Methods:', p.totalMethods);
  console.log('Steps:', p.totalSteps);
}

// CLI
const cmd = process.argv[2];
if (cmd === 'status') showStatus();
else runMigration();
