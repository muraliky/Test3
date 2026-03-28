#!/usr/bin/env node
/**
 * Queue Manager - Track migration progress
 * 
 * Commands:
 *   npm run queue:init    - Initialize queue from pending-methods.json
 *   npm run queue:status  - Show current status
 *   npm run queue:next    - Get next file to process
 *   npm run queue:done    - Mark file as done
 *   npm run queue:fail    - Mark file as failed
 *   npm run queue:reset   - Reset queue
 */

const fs = require('fs');
const path = require('path');

const STATE_DIR = './state';
const QUEUE_FILE = path.join(STATE_DIR, 'queue.json');
const PENDING_FILE = './pending-methods.json';

// Ensure state directory exists
function ensureStateDir() {
  if (!fs.existsSync(STATE_DIR)) {
    fs.mkdirSync(STATE_DIR, { recursive: true });
  }
}

/**
 * Initialize queue from pending-methods.json
 */
function initQueue() {
  ensureStateDir();
  
  if (!fs.existsSync(PENDING_FILE)) {
    console.error('❌ pending-methods.json not found');
    console.error('   Run: npm run migrate');
    process.exit(1);
  }
  
  const pending = JSON.parse(fs.readFileSync(PENDING_FILE, 'utf-8'));
  
  // Build work items
  const items = [];
  
  // Add page files
  for (const file of pending.pageFiles) {
    items.push({
      id: items.length + 1,
      type: 'page',
      file: file,
      path: `src/pages/${file}`,
      methods: pending.pages[file] || [],
      status: 'pending'
    });
  }
  
  // Add step files
  for (const file of pending.stepFiles) {
    items.push({
      id: items.length + 1,
      type: 'step',
      file: file,
      path: `src/steps/${file}`,
      methods: pending.steps[file] || [],
      status: 'pending'
    });
  }
  
  const queue = {
    created: new Date().toISOString(),
    totalFiles: items.length,
    totalMethods: pending.totalMethods,
    totalSteps: pending.totalSteps,
    items: items
  };
  
  fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2));
  
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('                    QUEUE INITIALIZED');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
  console.log(`   Files:    ${items.length}`);
  console.log(`   ├─ Pages: ${pending.pageFiles.length} (${pending.totalMethods} methods)`);
  console.log(`   └─ Steps: ${pending.stepFiles.length} (${pending.totalSteps} steps)`);
  console.log('');
  console.log('   Next: Get first file');
  console.log('         npm run queue:next');
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
}

/**
 * Show queue status
 */
function showStatus() {
  if (!fs.existsSync(QUEUE_FILE)) {
    console.log('Queue not initialized. Run: npm run queue:init');
    return;
  }
  
  const queue = JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf-8'));
  
  const pending = queue.items.filter(i => i.status === 'pending');
  const inProgress = queue.items.filter(i => i.status === 'in_progress');
  const done = queue.items.filter(i => i.status === 'done');
  const failed = queue.items.filter(i => i.status === 'failed');
  
  const pct = queue.totalFiles > 0 
    ? ((done.length / queue.totalFiles) * 100).toFixed(1)
    : 0;
  
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('                    QUEUE STATUS');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
  console.log(`   Total:       ${queue.totalFiles} files`);
  console.log(`   ├─ Pending:  ${pending.length}`);
  console.log(`   ├─ Working:  ${inProgress.length}`);
  console.log(`   ├─ Done:     ${done.length} ✅`);
  console.log(`   └─ Failed:   ${failed.length} ❌`);
  console.log('');
  console.log(`   Progress:    ${pct}%`);
  console.log('');
  
  if (inProgress.length > 0) {
    console.log('   Current:');
    inProgress.forEach(item => {
      console.log(`     → ${item.file} (${item.methods.length} methods)`);
    });
    console.log('');
  }
  
  if (failed.length > 0) {
    console.log('   Failed:');
    failed.forEach(item => {
      console.log(`     ✗ ${item.file}`);
    });
    console.log('');
    console.log('   Fix with: @pw-migrate <filename>');
    console.log('');
  }
  
  if (pending.length === 0 && inProgress.length === 0) {
    console.log('   ✅ QUEUE COMPLETE');
    console.log('');
    console.log('   Next: npm run verify');
  } else if (pending.length > 0) {
    console.log('   Next file:');
    console.log(`     npm run queue:next`);
  }
  
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
}

/**
 * Get next pending file
 */
function getNext() {
  if (!fs.existsSync(QUEUE_FILE)) {
    console.log('Queue not initialized. Run: npm run queue:init');
    return;
  }
  
  const queue = JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf-8'));
  
  // Find first pending item
  const item = queue.items.find(i => i.status === 'pending');
  
  if (!item) {
    const inProgress = queue.items.filter(i => i.status === 'in_progress');
    if (inProgress.length > 0) {
      console.log('');
      console.log('No pending files. Currently in progress:');
      inProgress.forEach(i => console.log(`  → ${i.file}`));
      console.log('');
      console.log('Mark as done: npm run queue:done <filename>');
    } else {
      console.log('');
      console.log('✅ All files processed!');
      console.log('');
      console.log('Next: npm run verify');
    }
    return;
  }
  
  // Mark as in progress
  item.status = 'in_progress';
  item.startedAt = new Date().toISOString();
  fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2));
  
  const done = queue.items.filter(i => i.status === 'done').length;
  const total = queue.totalFiles;
  
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`   NEXT FILE [${done + 1}/${total}]`);
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
  console.log(`   File:     ${item.file}`);
  console.log(`   Type:     ${item.type}`);
  console.log(`   Path:     ${item.path}`);
  console.log(`   Methods:  ${item.methods.length}`);
  console.log('');
  console.log('   Methods to implement:');
  item.methods.slice(0, 10).forEach(m => {
    const display = typeof m === 'string' ? m : m.name || JSON.stringify(m);
    console.log(`     • ${display.substring(0, 60)}`);
  });
  if (item.methods.length > 10) {
    console.log(`     ... and ${item.methods.length - 10} more`);
  }
  console.log('');
  console.log('   When done: npm run queue:done ' + item.file);
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
}

/**
 * Mark file as done
 */
function markDone(filename) {
  if (!filename) {
    console.error('Usage: npm run queue:done <filename>');
    process.exit(1);
  }
  
  if (!fs.existsSync(QUEUE_FILE)) {
    console.log('Queue not initialized.');
    return;
  }
  
  const queue = JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf-8'));
  
  const item = queue.items.find(i => 
    i.file === filename || 
    i.file === filename.replace('.ts', '') + '.ts' ||
    i.path === filename ||
    i.path.endsWith(filename)
  );
  
  if (!item) {
    console.error(`File not found in queue: ${filename}`);
    return;
  }
  
  item.status = 'done';
  item.completedAt = new Date().toISOString();
  
  fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2));
  
  const done = queue.items.filter(i => i.status === 'done').length;
  const total = queue.totalFiles;
  
  console.log('');
  console.log(`✅ Marked done: ${item.file} [${done}/${total}]`);
  console.log('');
  
  // Show next
  const next = queue.items.find(i => i.status === 'pending');
  if (next) {
    console.log(`Next: npm run queue:next`);
  } else {
    console.log('All files done! Run: npm run verify');
  }
  console.log('');
}

/**
 * Mark file as failed
 */
function markFailed(filename) {
  if (!filename) {
    console.error('Usage: npm run queue:fail <filename>');
    process.exit(1);
  }
  
  if (!fs.existsSync(QUEUE_FILE)) {
    console.log('Queue not initialized.');
    return;
  }
  
  const queue = JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf-8'));
  
  const item = queue.items.find(i => 
    i.file === filename || 
    i.path === filename ||
    i.path.endsWith(filename)
  );
  
  if (!item) {
    console.error(`File not found in queue: ${filename}`);
    return;
  }
  
  item.status = 'failed';
  item.failedAt = new Date().toISOString();
  
  fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2));
  
  console.log('');
  console.log(`❌ Marked failed: ${item.file}`);
  console.log('   Fix with: @pw-migrate ' + item.file);
  console.log('');
}

/**
 * Reset queue
 */
function resetQueue() {
  if (fs.existsSync(QUEUE_FILE)) {
    fs.unlinkSync(QUEUE_FILE);
  }
  console.log('Queue reset. Run: npm run queue:init');
}

/**
 * List all files with status
 */
function listAll() {
  if (!fs.existsSync(QUEUE_FILE)) {
    console.log('Queue not initialized. Run: npm run queue:init');
    return;
  }
  
  const queue = JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf-8'));
  
  console.log('');
  console.log('ALL FILES:');
  console.log('');
  
  queue.items.forEach((item, i) => {
    const status = {
      'pending': '⏳',
      'in_progress': '🔄',
      'done': '✅',
      'failed': '❌'
    }[item.status] || '?';
    
    console.log(`  ${status} ${i + 1}. ${item.file} (${item.methods.length} methods)`);
  });
  
  console.log('');
}

// CLI
const command = process.argv[2];
const arg = process.argv[3];

switch (command) {
  case 'init':
    initQueue();
    break;
  case 'status':
    showStatus();
    break;
  case 'next':
    getNext();
    break;
  case 'done':
    markDone(arg);
    break;
  case 'fail':
    markFailed(arg);
    break;
  case 'reset':
    resetQueue();
    break;
  case 'list':
    listAll();
    break;
  case 'help':
  default:
    console.log(`
Queue Manager - Track migration progress

Commands:
  npm run queue:init         Initialize queue from pending-methods.json
  npm run queue:status       Show current status
  npm run queue:next         Get next file to process
  npm run queue:done <file>  Mark file as done
  npm run queue:fail <file>  Mark file as failed
  npm run queue:list         List all files with status
  npm run queue:reset        Reset queue

Workflow:
  1. npm run migrate         Generate skeletons
  2. npm run queue:init      Initialize queue
  3. npm run queue:next      Get next file
  4. @pw-migrate <file>      Convert the file
  5. npm run queue:done      Mark as done
  6. Repeat 3-5 for all files
  7. npm run verify          Validate all
`);
}
