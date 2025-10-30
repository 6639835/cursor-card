#!/usr/bin/env node
/**
 * Build script to create Firefox-compatible version with code obfuscation
 * Removes ES6 export statements for Manifest V2 compatibility
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import JavaScriptObfuscator from 'javascript-obfuscator';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..', '..');

const outputDir = path.join(ROOT_DIR, 'build-firefox');

// Obfuscation options - Firefox-compatible (lighter settings)
const obfuscationOptions = {
  compact: true,
  controlFlowFlattening: false,  // Disabled for Firefox compatibility
  deadCodeInjection: false,      // Disabled for Firefox compatibility
  debugProtection: false,
  debugProtectionInterval: 0,
  disableConsoleOutput: false,
  identifierNamesGenerator: 'hexadecimal',
  log: false,
  numbersToExpressions: false,   // Disabled for Firefox compatibility
  renameGlobals: false,
  selfDefending: false,          // Disabled for Firefox compatibility - this often causes issues
  simplify: true,
  splitStrings: false,           // Disabled for Firefox compatibility
  stringArray: true,
  stringArrayCallsTransform: false,  // Disabled for Firefox compatibility
  stringArrayEncoding: [],       // No encoding for better compatibility
  stringArrayThreshold: 0.5,
  transformObjectKeys: false,    // Disabled for Firefox compatibility
  unicodeEscapeSequence: false
};

// Light obfuscation for better compatibility
const lightObfuscationOptions = {
  compact: true,
  controlFlowFlattening: false,
  deadCodeInjection: false,
  identifierNamesGenerator: 'hexadecimal',
  renameGlobals: false,
  stringArray: true,
  stringArrayEncoding: ['base64'],
  stringArrayThreshold: 0.5,
  transformObjectKeys: true
};

function obfuscateFile(srcPath, destPath, useLight = false) {
  console.log(`🔒 Obfuscating: ${path.basename(srcPath)}`);
  const code = fs.readFileSync(srcPath, 'utf8');

  const options = useLight ? lightObfuscationOptions : obfuscationOptions;
  const obfuscatedCode = JavaScriptObfuscator.obfuscate(code, options).getObfuscatedCode();

  fs.writeFileSync(destPath, obfuscatedCode, 'utf8');
}

function obfuscateDirectory(srcDir, destDir, useLight = false) {
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  const entries = fs.readdirSync(srcDir, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);

    if (entry.isDirectory()) {
      obfuscateDirectory(srcPath, destPath, useLight);
    } else if (entry.name.endsWith('.js')) {
      obfuscateFile(srcPath, destPath, useLight);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log('🦊 Building Firefox extension with code obfuscation...\n');

// Clean build directory
if (fs.existsSync(outputDir)) {
  fs.rmSync(outputDir, { recursive: true, force: true });
}
fs.mkdirSync(outputDir, { recursive: true });
console.log('📁 Cleaned build directory');

// Obfuscate source files
console.log('🔒 Obfuscating source files...');
obfuscateDirectory(path.join(ROOT_DIR, 'src'), path.join(outputDir, 'src'), false);

// Obfuscate popup.js (light obfuscation for compatibility)
obfuscateFile(path.join(ROOT_DIR, 'extension/popup.js'), path.join(outputDir, 'popup.js'), true);

// Copy background script without obfuscation (required for script injection to work)
console.log('📄 Copying background_firefox.js (no obfuscation for injection compatibility)...');
fs.copyFileSync(path.join(ROOT_DIR, 'extension/background-firefox.js'), path.join(outputDir, 'background_firefox.js'));

// Copy HTML and CSS (no obfuscation needed)
console.log('📄 Copying HTML and CSS files...');
fs.copyFileSync(path.join(ROOT_DIR, 'extension/popup.html'), path.join(outputDir, 'popup.html'));
fs.copyFileSync(path.join(ROOT_DIR, 'extension/popup.css'), path.join(outputDir, 'popup.css'));

// Copy manifest
fs.copyFileSync(path.join(ROOT_DIR, 'manifests/manifest-firefox.json'), path.join(outputDir, 'manifest.json'));
console.log('✅ Copied: manifests/manifest-firefox.json -> build-firefox/manifest.json');

// Copy asset directories
console.log('📋 Copying assets...');
const dirsToCopy = ['extension/public', 'extension/assets'];
dirsToCopy.forEach(dir => {
  const dirName = path.basename(dir);
  copyDir(path.join(ROOT_DIR, dir), path.join(outputDir, dirName));
  console.log(`✅ Copied directory: ${dir}`);
});

console.log('\n✅ Firefox build completed successfully!');
console.log('📦 Build output: build-firefox/');
console.log('\n📌 Next steps:');
console.log('   1. Test: Load from about:debugging -> This Firefox -> Load Temporary Add-on');
console.log('   2. Package: npm run firefox:build');
console.log('   3. Sign and publish: npm run firefox:sign');
console.log('\n⚠️  Note: Always test the obfuscated build thoroughly before publishing!');

function copyDir(src, dest, skipFiles = []) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    // Skip files that were already converted
    if (skipFiles.includes(srcPath)) {
      continue;
    }

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath, skipFiles);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

