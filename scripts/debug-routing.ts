#!/usr/bin/env node

/**
 * Debug routing issues
 */

import fs from 'fs';

console.log('🔍 DEBUGGING ROUTING ISSUES...\n');

// Check all critical files
console.log('📁 Critical Files Check:');
const files = [
  'app/layout.tsx',
  'app/page.tsx', 
  'app/[locale]/layout.tsx',
  'app/[locale]/page.tsx',
  'middleware.ts'
];

files.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`  ${exists ? '✅' : '❌'} ${file}`);
  
  if (exists) {
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n').length;
    console.log(`    📄 ${lines} lines`);
    
    if (file.includes('page.tsx')) {
      const hasExport = content.includes('export default');
      console.log(`    ${hasExport ? '✅' : '❌'} Has default export`);
    }
  }
});

// Check middleware
console.log('\n🔧 Middleware Analysis:');
if (fs.existsSync('middleware.ts')) {
  const middlewareContent = fs.readFileSync('middleware.ts', 'utf-8');
  console.log(`  ${middlewareContent.includes('createMiddleware') ? '✅' : '❌'} Uses createMiddleware`);
  console.log(`  ${middlewareContent.includes('fr') ? '✅' : '❌'} Includes French locale`);
  console.log(`  ${middlewareContent.includes('matcher') ? '✅' : '❌'} Has matcher config`);
}

// Check if there are conflicting routes
console.log('\n🚨 Potential Conflicts:');
const conflictingFiles = [
  'app/fr/page.tsx',
  'app/fr/layout.tsx',
  'pages/index.tsx',
  'pages/_app.tsx'
];

conflictingFiles.forEach(file => {
  const exists = fs.existsSync(file);
  if (exists) {
    console.log(`  ⚠️  CONFLICT: ${file} exists (should not exist with app router)`);
  }
});

console.log('\n📋 Troubleshooting Checklist:');
console.log('1. ✅ Restart dev server completely');
console.log('2. ✅ Clear .next folder');
console.log('3. ✅ Clear browser cache');
console.log('4. ✅ Try incognito mode');
console.log('5. ✅ Check server terminal for errors');
console.log('6. ✅ Check browser console for errors');
console.log('7. ✅ Try visiting /fr directly');

console.log('\n🎯 Expected URLs:');
console.log('- http://localhost:3000/ → should redirect');
console.log('- http://localhost:3000/fr → should show page');
console.log('- http://localhost:3000/en → should show page');

console.log('\n💡 If still not working:');
console.log('- Check if Next.js dev server is actually running');
console.log('- Verify no other process is using port 3000');
console.log('- Try a different port: npm run dev -- -p 3001');
console.log('- Check if there are any TypeScript errors preventing compilation');