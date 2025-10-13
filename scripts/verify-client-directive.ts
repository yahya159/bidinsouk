#!/usr/bin/env node

/**
 * Verify client directive is properly set
 */

import fs from 'fs';

console.log('🔍 Verifying Client Directive...\n');

const files = [
  'app/error.tsx',
  'app/not-found.tsx'
];

files.forEach(file => {
  console.log(`📄 Checking ${file}:`);
  
  if (!fs.existsSync(file)) {
    console.log(`  ❌ File does not exist`);
    return;
  }
  
  const content = fs.readFileSync(file, 'utf-8');
  const lines = content.split('\n');
  const firstLine = lines[0].trim();
  
  console.log(`  First line: "${firstLine}"`);
  
  const hasUseClient = firstLine === '"use client";' || firstLine === "'use client';";
  const usesRouter = content.includes('useRouter');
  const hasOnClick = content.includes('onClick');
  
  console.log(`  ${hasUseClient ? '✅' : '❌'} Has "use client" directive`);
  console.log(`  ${usesRouter ? '✅' : '❌'} Uses useRouter (requires client)`);
  console.log(`  ${hasOnClick ? '✅' : '❌'} Has onClick handlers (requires client)`);
  console.log('');
});

console.log('🚀 Next steps:');
console.log('1. Try running `npm run dev` again');
console.log('2. If still failing, restart your terminal/IDE');
console.log('3. Clear browser cache if needed');