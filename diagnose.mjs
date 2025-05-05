import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('=== HTTP Context Middleware Build Diagnostics ===');

// Check Node.js and npm versions
console.log('\n=== Environment ===');
console.log(`Node.js version: ${process.version}`);
try {
  const npmVersion = execSync('npm --version').toString().trim();
  console.log(`npm version: ${npmVersion}`);
} catch (error) {
  console.log('Error getting npm version:', error.message);
}

// Check for TypeScript installation
console.log('\n=== TypeScript ===');
try {
  const tsVersion = execSync('npx tsc --version').toString().trim();
  console.log(tsVersion);
} catch (error) {
  console.log('Error running TypeScript:', error.message);
}

// Check for tsconfig.json
console.log('\n=== TypeScript Configuration ===');
if (fs.existsSync('tsconfig.json')) {
  console.log('tsconfig.json exists');
  try {
    const tsconfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
    console.log('Configuration looks valid');
    console.log('Target:', tsconfig.compilerOptions.target);
    console.log('Module:', tsconfig.compilerOptions.module);
    console.log('Output directory:', tsconfig.compilerOptions.outDir);
  } catch (error) {
    console.log('Error parsing tsconfig.json:', error.message);
  }
} else {
  console.log('tsconfig.json does not exist!');
}

// Check source files
console.log('\n=== Source Files ===');
const sourceDir = path.join(__dirname, 'src');
if (fs.existsSync(sourceDir)) {
  const files = fs.readdirSync(sourceDir, { recursive: true })
    .filter(file => file.endsWith('.ts') || file.endsWith('.mts'));
  console.log(`Found ${files.length} TypeScript files`);
  console.log('Files:', files.join(', '));
} else {
  console.log('src directory does not exist!');
}

// Try dry run of TypeScript compilation
console.log('\n=== TypeScript Dry Run ===');
try {
  execSync('npx tsc --noEmit', { stdio: 'inherit' });
  console.log('TypeScript compilation looks good (dry run)');
} catch (error) {
  // Error output is already displayed by inherit
  console.log('TypeScript compilation has errors');
}

console.log('\n=== End of Diagnostics ===');
