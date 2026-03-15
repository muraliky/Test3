#!/usr/bin/env node
/**
 * PHASE 1: Selenium to Playwright-BDD Migration Script
 * 
 * Creates SKELETON files with TODO markers.
 * Method logic is left for Copilot agent to implement.
 * 
 * USAGE:
 *   npm run migrate              - Migrate all files (skeleton)
 *   npm run migrate:full         - Migrate with auto-conversion (no agent needed)
 *   npm run migrate:status       - Show pending implementations
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
  featuresOut: './features',
  pendingFile: './pending-methods.json',
};

// Track pending implementations
let pendingMethods = {
  pages: {},
  steps: {},
  totalMethods: 0,
  totalSteps: 0,
};

// ═══════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════

function toKebabCase(str) {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();
}

function toCamelCase(str) {
  return str.charAt(0).toLowerCase() + str.slice(1);
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

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
// LOCATOR CONVERSION
// ═══════════════════════════════════════════════════════════════

function convertLocator(javaLocator) {
  let locator = javaLocator.trim();
  
  // Button with exact text
  let match = locator.match(/\/\/button\[text\(\)\s*=\s*['"]([^'"]+)['"]\]/);
  if (match) return `getByRole('button', { name: '${match[1]}' })`;
  
  // Button with contains text
  match = locator.match(/\/\/button\[contains\(text\(\),\s*['"]([^'"]+)['"]\)\]/);
  if (match) return `getByRole('button', { name: /${match[1]}/i })`;
  
  // Link with text
  match = locator.match(/\/\/a\[text\(\)\s*=\s*['"]([^'"]+)['"]\]/);
  if (match) return `getByRole('link', { name: '${match[1]}' })`;
  
  // Link with contains
  match = locator.match(/\/\/a\[contains\(text\(\),\s*['"]([^'"]+)['"]\)\]/);
  if (match) return `getByRole('link', { name: /${match[1]}/i })`;
  
  // Input with placeholder
  match = locator.match(/\/\/input\[@placeholder\s*=\s*['"]([^'"]+)['"]\]/);
  if (match) return `getByPlaceholder('${match[1]}')`;
  
  // Label with text
  match = locator.match(/\/\/label\[text\(\)\s*=\s*['"]([^'"]+)['"]\]/);
  if (match) return `getByLabel('${match[1]}')`;
  
  // Data-testid
  match = locator.match(/\/\/\*\[@data-testid\s*=\s*['"]([^'"]+)['"]\]/);
  if (match) return `getByTestId('${match[1]}')`;
  
  match = locator.match(/\/\/\*\[@data-test\s*=\s*['"]([^'"]+)['"]\]/);
  if (match) return `getByTestId('${match[1]}')`;
  
  // ID locator - XPath
  match = locator.match(/\/\/\*\[@id\s*=\s*['"]([^'"]+)['"]\]/);
  if (match) return `locator('#${match[1]}')`;
  
  match = locator.match(/\/\/input\[@id\s*=\s*['"]([^'"]+)['"]\]/);
  if (match) return `locator('#${match[1]}')`;
  
  match = locator.match(/\/\/\w+\[@id\s*=\s*['"]([^'"]+)['"]\]/);
  if (match) return `locator('#${match[1]}')`;
  
  // By.id
  match = locator.match(/By\.id\s*\(\s*["']([^'"]+)["']\s*\)/);
  if (match) return `locator('#${match[1]}')`;
  
  // By.name
  match = locator.match(/By\.name\s*\(\s*["']([^'"]+)["']\s*\)/);
  if (match) return `locator('[name="${match[1]}"]')`;
  
  // By.className
  match = locator.match(/By\.className\s*\(\s*["']([^'"]+)["']\s*\)/);
  if (match) return `locator('.${match[1]}')`;
  
  // By.cssSelector
  match = locator.match(/By\.cssSelector\s*\(\s*["']([^'"]+)["']\s*\)/);
  if (match) return `locator('${match[1]}')`;
  
  // By.xpath
  match = locator.match(/By\.xpath\s*\(\s*["']([^'"]+)["']\s*\)/);
  if (match) return `locator('${match[1]}')`;
  
  // Generic XPath fallback
  if (locator.startsWith('//')) {
    return `locator('${locator}')`;
  }
  
  return `locator('${locator}')`;
}

// ═══════════════════════════════════════════════════════════════
// TYPE CONVERSION
// ═══════════════════════════════════════════════════════════════

function javaToTsType(javaType) {
  const typeMap = {
    'String': 'string',
    'int': 'number',
    'Integer': 'number',
    'long': 'number',
    'Long': 'number',
    'double': 'number',
    'Double': 'number',
    'float': 'number',
    'Float': 'number',
    'boolean': 'boolean',
    'Boolean': 'boolean',
    'void': 'void',
    'List': 'Array<any>',
    'Map': 'Record<string, any>',
    'Object': 'unknown',
    'WebElement': 'Locator',
  };
  return typeMap[javaType] || 'unknown';
}

function convertParams(javaParams) {
  if (!javaParams.trim()) {
    return { params: '', docs: '' };
  }
  
  const params = [];
  const docs = [];
  
  const paramList = javaParams.split(',').map(p => p.trim());
  for (const param of paramList) {
    const parts = param.split(/\s+/);
    if (parts.length >= 2) {
      const javaType = parts[0];
      const paramName = parts[parts.length - 1];
      const tsType = javaToTsType(javaType);
      params.push(`${paramName}: ${tsType}`);
      docs.push(`   * @param {${tsType}} ${paramName}`);
    }
  }
  
  return {
    params: params.join(', '),
    docs: docs.join('\n'),
  };
}

// ═══════════════════════════════════════════════════════════════
// PARSE JAVA PAGE FILE
// ═══════════════════════════════════════════════════════════════

function parseJavaPage(content, fileName) {
  const result = {
    className: '',
    locators: [],
    methods: [],
  };
  
  // Extract class name
  const classMatch = content.match(/public\s+class\s+(\w+)/);
  result.className = classMatch ? classMatch[1] : fileName.replace('.java', '');
  
  // Extract @FindBy locators
  const findByRegex = /@FindBy\s*\(\s*(\w+)\s*=\s*["']([^'"]+)["']\s*\)\s*(?:public|private|protected)?\s*\w+\s+(\w+)\s*;/g;
  let match;
  while ((match = findByRegex.exec(content)) !== null) {
    const [, locatorType, locatorValue, fieldName] = match;
    let convertedLocator;
    
    if (locatorType === 'xpath') {
      convertedLocator = convertLocator(locatorValue);
    } else if (locatorType === 'id') {
      convertedLocator = `locator('#${locatorValue}')`;
    } else if (locatorType === 'name') {
      convertedLocator = `locator('[name="${locatorValue}"]')`;
    } else if (locatorType === 'className' || locatorType === 'css') {
      convertedLocator = `locator('.${locatorValue}')`;
    } else {
      convertedLocator = `locator('${locatorValue}')`;
    }
    
    result.locators.push({
      name: fieldName,
      original: `${locatorType}="${locatorValue}"`,
      converted: convertedLocator,
    });
  }
  
  // Extract QAF/String locators
  const qafRegex = /(?:private|public|protected)?\s*String\s+(\w+)\s*=\s*["'](?:xpath\s*[:=]\s*)?([^'"]+)["']\s*;/g;
  while ((match = qafRegex.exec(content)) !== null) {
    const [, fieldName, locatorValue] = match;
    if (locatorValue.includes('//') || locatorValue.includes('@')) {
      result.locators.push({
        name: fieldName,
        original: locatorValue.substring(0, 50),
        converted: convertLocator(locatorValue),
      });
    }
  }
  
  // Extract By locators
  const byRegex = /(?:private|public|protected)?\s*By\s+(\w+)\s*=\s*(By\.\w+\s*\([^)]+\))\s*;/g;
  while ((match = byRegex.exec(content)) !== null) {
    const [, fieldName, byLocator] = match;
    result.locators.push({
      name: fieldName,
      original: byLocator.substring(0, 50),
      converted: convertLocator(byLocator),
    });
  }
  
  // Extract methods
  const methodRegex = /(?:\/\*\*[\s\S]*?\*\/\s*)?public\s+(\w+)\s+(\w+)\s*\(([^)]*)\)\s*(?:throws\s+\w+)?\s*\{([\s\S]*?)\n\s{0,4}\}/g;
  while ((match = methodRegex.exec(content)) !== null) {
    const [fullMatch, returnType, methodName, params, body] = match;
    
    // Skip constructor
    if (methodName === result.className) continue;
    
    result.methods.push({
      name: methodName,
      returnType: returnType,
      params: params.trim(),
      body: body.trim(),
    });
  }
  
  return result;
}

// ═══════════════════════════════════════════════════════════════
// GENERATE SKELETON PAGE (Phase 1)
// ═══════════════════════════════════════════════════════════════

function generateSkeletonPage(parsed, originalFileName, javaSourcePath) {
  const kebabName = toKebabCase(parsed.className.replace(/Page$/, ''));
  const methodNames = [];
  
  let output = `/**
 * @fileoverview ${parsed.className} - Page Object
 * @author Migration Script (Phase 1 - Skeleton)
 * @version 1.0.0
 * 
 * @source ${javaSourcePath}
 * Migrated from: ${originalFileName}
 * 
 * STATUS: PENDING IMPLEMENTATION
 * Run: @pw-implement ${kebabName}.page.ts
 */

import { Page, Locator, expect } from '@playwright/test';

/**
 * ${parsed.className} page object class.
 */
export class ${parsed.className} {
  /** Playwright page instance */
  readonly page: Page;

`;

  // Add locators
  for (const loc of parsed.locators) {
    output += `  /** ${loc.name} - Original: ${loc.original} */\n`;
    output += `  readonly ${loc.name}: Locator;\n\n`;
  }

  // Constructor
  output += `  /**
   * Creates an instance of ${parsed.className}.
   * @param {Page} page - Playwright page instance
   */
  constructor(page: Page) {
    this.page = page;\n`;

  for (const loc of parsed.locators) {
    output += `    this.${loc.name} = page.${loc.converted};\n`;
  }
  output += `  }\n\n`;

  // Methods - SKELETON ONLY
  for (const method of parsed.methods) {
    const tsParams = convertParams(method.params);
    const tsReturn = javaToTsType(method.returnType);
    methodNames.push(method.name);
    
    // Escape the Java body for embedding in comments
    const javaBodyLines = method.body.split('\n').map(l => l.trim()).filter(l => l);
    const javaBodyComment = javaBodyLines.map(line => `   *   ${line}`).join('\n');
    
    output += `  /**
   * ${method.name}
   * 
   * @status TODO - Implement this method
   * @original-java
${javaBodyComment}
   * 
${tsParams.docs ? tsParams.docs + '\n' : ''}   * @returns {Promise<${tsReturn}>}
   */
  async ${method.name}(${tsParams.params}): Promise<${tsReturn}> {
    // ═══════════════════════════════════════════════════════════
    // TODO: @pw-implement - Convert Java logic to Playwright
    // ═══════════════════════════════════════════════════════════
    throw new Error('Method ${method.name} not implemented - run @pw-implement');
  }\n\n`;
  }

  output += `}\n`;
  
  return {
    content: output,
    fileName: `${kebabName}.page.ts`,
    methods: methodNames,
  };
}

// ═══════════════════════════════════════════════════════════════
// PARSE JAVA STEP FILE
// ═══════════════════════════════════════════════════════════════

function parseJavaSteps(content, fileName) {
  const result = {
    className: '',
    steps: [],
  };
  
  const classMatch = content.match(/public\s+class\s+(\w+)/);
  result.className = classMatch ? classMatch[1] : fileName.replace('.java', '');
  
  const stepRegex = /@(Given|When|Then|And|But)\s*\(\s*["']([^'"]+)["']\s*\)\s*public\s+void\s+(\w+)\s*\(([^)]*)\)\s*(?:throws\s+\w+)?\s*\{([\s\S]*?)\n\s{0,4}\}/g;
  let match;
  
  while ((match = stepRegex.exec(content)) !== null) {
    const [, annotation, stepText, methodName, params, body] = match;
    
    // Convert @And/@But
    let convertedAnnotation = annotation;
    if (annotation === 'And' || annotation === 'But') {
      const lower = stepText.toLowerCase();
      if (lower.includes('click') || lower.includes('enter') || lower.includes('select') || lower.includes('type')) {
        convertedAnnotation = 'When';
      } else if (lower.includes('should') || lower.includes('verify') || lower.includes('see') || lower.includes('displayed')) {
        convertedAnnotation = 'Then';
      } else {
        convertedAnnotation = 'Given';
      }
    }
    
    result.steps.push({
      annotation: convertedAnnotation,
      stepText,
      methodName,
      params: params.trim(),
      body: body.trim(),
    });
  }
  
  return result;
}

// ═══════════════════════════════════════════════════════════════
// GENERATE SKELETON STEPS (Phase 1)
// ═══════════════════════════════════════════════════════════════

function generateSkeletonSteps(parsed, originalFileName, javaSourcePath) {
  const kebabName = toKebabCase(parsed.className.replace(/Steps?$/, ''));
  const stepNames = [];
  
  let output = `/**
 * @fileoverview ${parsed.className} - Step Definitions
 * @author Migration Script (Phase 1 - Skeleton)
 * @version 1.0.0
 * 
 * @source ${javaSourcePath}
 * Migrated from: ${originalFileName}
 * 
 * STATUS: PENDING IMPLEMENTATION
 * Run: @pw-implement ${kebabName}.steps.ts
 */

import { Given, When, Then, expect } from './fixtures';

`;

  for (const step of parsed.steps) {
    const tsParams = convertParams(step.params);
    stepNames.push(step.stepText);
    
    // Escape Java body
    const javaBodyLines = step.body.split('\n').map(l => l.trim()).filter(l => l);
    const javaBodyComment = javaBodyLines.map(line => ` *   ${line}`).join('\n');
    
    // Build fixture list (detect page objects used)
    const fixtures = ['page'];
    const pageMatches = step.body.match(/(\w+)Page\./g);
    if (pageMatches) {
      pageMatches.forEach(p => {
        const name = toCamelCase(p.replace('.', ''));
        if (!fixtures.includes(name)) fixtures.push(name);
      });
    }
    
    output += `/**
 * @step ${step.annotation}: ${step.stepText}
 * @status TODO - Implement this step
 * @original-java
${javaBodyComment}
 */
${step.annotation}('${step.stepText}', async ({ ${fixtures.join(', ')} }${tsParams.params ? `, ${tsParams.params}` : ''}) => {
  // ═══════════════════════════════════════════════════════════
  // TODO: @pw-implement - Convert Java logic to Playwright
  // ═══════════════════════════════════════════════════════════
  throw new Error('Step not implemented - run @pw-implement');
});\n\n`;
  }
  
  return {
    content: output,
    fileName: `${kebabName}.steps.ts`,
    steps: stepNames,
  };
}

// ═══════════════════════════════════════════════════════════════
// GENERATE FIXTURES
// ═══════════════════════════════════════════════════════════════

function generateFixtures(pagesDir) {
  const pageFiles = getAllFiles(pagesDir, '.page.ts');
  
  let imports = '';
  let fixtureTypes = '';
  let fixtureImpl = '';
  
  for (const pageFile of pageFiles) {
    const fileName = path.basename(pageFile, '.page.ts');
    const className = fileName
      .split('-')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join('') + 'Page';
    const fixtureName = toCamelCase(className);
    const relativePath = path.relative(pagesDir, pageFile).replace(/\\/g, '/').replace('.page.ts', '.page');
    
    imports += `import { ${className} } from '../pages/${relativePath}';\n`;
    fixtureTypes += `  /** ${className} instance */\n  ${fixtureName}: ${className};\n`;
    fixtureImpl += `  ${fixtureName}: async ({ page }, use) => {\n    await use(new ${className}(page));\n  },\n`;
  }
  
  return `/**
 * @fileoverview Playwright-BDD Fixtures
 * @author Migration Script
 * @version 1.0.0
 */

import { test as base, createBdd } from 'playwright-bdd';

${imports}
/**
 * Page fixture types
 */
type PageFixtures = {
${fixtureTypes}};

/**
 * Extended test with page fixtures
 */
export const test = base.extend<PageFixtures>({
${fixtureImpl}});

/**
 * BDD functions with fixtures
 */
export const { Given, When, Then } = createBdd(test);

/**
 * Re-export expect
 */
export { expect } from '@playwright/test';
`;
}

// ═══════════════════════════════════════════════════════════════
// GENERATE CONFIG
// ═══════════════════════════════════════════════════════════════

function generateConfig() {
  return `/**
 * @fileoverview Playwright Configuration with BDD support
 */

import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig, cucumberReporter } from 'playwright-bdd';

const testDir = defineBddConfig({
  features: 'features/**/*.feature',
  steps: 'src/steps/**/*.ts',
});

export default defineConfig({
  testDir,
  timeout: 30 * 1000,
  retries: process.env.CI ? 2 : 0,
  
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
    cucumberReporter('html', { outputFile: 'cucumber-report/report.html' }),
  ],
  
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    viewport: { width: 1280, height: 720 },
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
`;
}

// ═══════════════════════════════════════════════════════════════
// MIGRATION FUNCTIONS
// ═══════════════════════════════════════════════════════════════

function migratePages() {
  console.log('\n📄 Migrating Page Files (Skeleton)...\n');
  
  const pagesDir = path.join(CONFIG.sourceDir, 'pages');
  const pageFiles = getAllFiles(pagesDir, '.java');
  
  if (pageFiles.length === 0) {
    console.log('   No page files found in', pagesDir);
    return;
  }
  
  ensureDir(CONFIG.pagesOut);
  let count = 0;
  
  for (const file of pageFiles) {
    try {
      const content = fs.readFileSync(file, 'utf-8');
      const fileName = path.basename(file);
      const parsed = parseJavaPage(content, fileName);
      const result = generateSkeletonPage(parsed, fileName, file);
      
      // Maintain folder structure
      const relativePath = path.relative(pagesDir, path.dirname(file));
      const outDir = path.join(CONFIG.pagesOut, relativePath);
      ensureDir(outDir);
      
      const outPath = path.join(outDir, result.fileName);
      fs.writeFileSync(outPath, result.content);
      
      // Track pending
      pendingMethods.pages[result.fileName] = result.methods;
      pendingMethods.totalMethods += result.methods.length;
      
      count++;
      console.log(`   ✅ ${fileName} → ${result.fileName}`);
      console.log(`      ${parsed.locators.length} locators | ${result.methods.length} methods (TODO)`);
    } catch (err) {
      console.log(`   ❌ ${path.basename(file)}: ${err.message}`);
    }
  }
  
  console.log(`\n   Migrated ${count}/${pageFiles.length} page files\n`);
}

function migrateSteps() {
  console.log('\n📝 Migrating Step Files (Skeleton)...\n');
  
  const stepsDir = path.join(CONFIG.sourceDir, 'steps');
  const stepFiles = getAllFiles(stepsDir, '.java');
  
  if (stepFiles.length === 0) {
    console.log('   No step files found in', stepsDir);
    return;
  }
  
  ensureDir(CONFIG.stepsOut);
  let count = 0;
  
  for (const file of stepFiles) {
    try {
      const content = fs.readFileSync(file, 'utf-8');
      const fileName = path.basename(file);
      const parsed = parseJavaSteps(content, fileName);
      const result = generateSkeletonSteps(parsed, fileName, file);
      
      const relativePath = path.relative(stepsDir, path.dirname(file));
      const outDir = path.join(CONFIG.stepsOut, relativePath);
      ensureDir(outDir);
      
      const outPath = path.join(outDir, result.fileName);
      fs.writeFileSync(outPath, result.content);
      
      // Track pending
      pendingMethods.steps[result.fileName] = result.steps;
      pendingMethods.totalSteps += result.steps.length;
      
      count++;
      console.log(`   ✅ ${fileName} → ${result.fileName}`);
      console.log(`      ${result.steps.length} steps (TODO)`);
    } catch (err) {
      console.log(`   ❌ ${path.basename(file)}: ${err.message}`);
    }
  }
  
  console.log(`\n   Migrated ${count}/${stepFiles.length} step files\n`);
}

function copyFeatures() {
  console.log('\n📋 Copying Feature Files...\n');
  
  const featuresDir = path.join(CONFIG.sourceDir, 'features');
  const featureFiles = getAllFiles(featuresDir, '.feature');
  
  if (featureFiles.length === 0) {
    console.log('   No feature files found');
    return;
  }
  
  ensureDir(CONFIG.featuresOut);
  let count = 0;
  
  for (const file of featureFiles) {
    try {
      const content = fs.readFileSync(file, 'utf-8');
      const relativePath = path.relative(featuresDir, file);
      const outPath = path.join(CONFIG.featuresOut, relativePath);
      ensureDir(path.dirname(outPath));
      fs.writeFileSync(outPath, content);
      count++;
      console.log(`   ✅ ${path.basename(file)}`);
    } catch (err) {
      console.log(`   ❌ ${path.basename(file)}: ${err.message}`);
    }
  }
  
  console.log(`\n   Copied ${count}/${featureFiles.length} feature files\n`);
}

function generateAll() {
  console.log('\n🔧 Generating Support Files...\n');
  
  ensureDir(CONFIG.stepsOut);
  
  // fixtures.ts
  const fixtures = generateFixtures(CONFIG.pagesOut);
  fs.writeFileSync(path.join(CONFIG.stepsOut, 'fixtures.ts'), fixtures);
  console.log('   ✅ Generated fixtures.ts');
  
  // playwright.config.ts
  const config = generateConfig();
  fs.writeFileSync('playwright.config.ts', config);
  console.log('   ✅ Generated playwright.config.ts');
  
  // pending-methods.json
  fs.writeFileSync(CONFIG.pendingFile, JSON.stringify(pendingMethods, null, 2));
  console.log('   ✅ Generated pending-methods.json');
  
  console.log('');
}

function showStatus() {
  console.log('\n');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('                    IMPLEMENTATION STATUS');
  console.log('═══════════════════════════════════════════════════════════════');
  
  if (!fs.existsSync(CONFIG.pendingFile)) {
    console.log('\n   No pending-methods.json found. Run migration first.');
    console.log('');
    return;
  }
  
  const pending = JSON.parse(fs.readFileSync(CONFIG.pendingFile, 'utf-8'));
  
  console.log('\n📄 PAGES:\n');
  for (const [file, methods] of Object.entries(pending.pages)) {
    if (methods.length > 0) {
      console.log(`   ${file}: ${methods.length} methods pending`);
    }
  }
  
  console.log('\n📝 STEPS:\n');
  for (const [file, steps] of Object.entries(pending.steps)) {
    if (steps.length > 0) {
      console.log(`   ${file}: ${steps.length} steps pending`);
    }
  }
  
  console.log('\n───────────────────────────────────────────────────────────────');
  console.log(`   Total: ${pending.totalMethods} methods + ${pending.totalSteps} steps pending`);
  console.log('───────────────────────────────────────────────────────────────');
  console.log('\n   Next: Run @pw-implement <filename> for each file\n');
}

function runMigration() {
  console.log('\n');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('     PHASE 1: SELENIUM TO PLAYWRIGHT-BDD MIGRATION (Skeleton)');
  console.log('═══════════════════════════════════════════════════════════════');
  
  migratePages();
  migrateSteps();
  copyFeatures();
  generateAll();
  
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('                 ✅ PHASE 1 COMPLETE (Skeleton)');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
  console.log(`   📊 Summary:`);
  console.log(`      • ${pendingMethods.totalMethods} methods need implementation`);
  console.log(`      • ${pendingMethods.totalSteps} steps need implementation`);
  console.log('');
  console.log('   📌 Next Steps:');
  console.log('');
  console.log('   PHASE 2: Implement methods using Copilot agent');
  console.log('      @pw-implement src/pages/login.page.ts');
  console.log('      @pw-implement src/steps/login.steps.ts');
  console.log('');
  console.log('   PHASE 3: Fix failing tests');
  console.log('      npm test');
  console.log('      @pw-debug <error message>');
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
}

// ═══════════════════════════════════════════════════════════════
// CLI
// ═══════════════════════════════════════════════════════════════

const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'status':
    showStatus();
    break;
  case 'help':
    console.log(`
Selenium to Playwright-BDD Migration (Hybrid Approach)

Phase 1 - Node.js (Skeleton):
  npm run migrate         - Create skeleton files with TODO markers
  npm run migrate:status  - Show pending implementations

Phase 2 - Copilot Agent (Logic):
  @pw-implement <file>    - Implement TODO methods in a file

Phase 3 - Debug Agent (Fixes):
  @pw-debug <error>       - Fix failing locators/tests
`);
    break;
  default:
    runMigration();
}
