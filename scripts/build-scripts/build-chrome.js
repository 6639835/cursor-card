import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import JavaScriptObfuscator from 'javascript-obfuscator';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..', '..');

const BUILD_DIR = path.join(ROOT_DIR, 'build-chrome');

// Obfuscation options - balance between protection and performance
const obfuscationOptions = {
  compact: true,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.75,
  deadCodeInjection: true,
  deadCodeInjectionThreshold: 0.4,
  debugProtection: false, // Set to true for extra protection but may cause issues
  debugProtectionInterval: 0,
  disableConsoleOutput: false, // Set to true in production
  identifierNamesGenerator: 'hexadecimal',
  log: false,
  numbersToExpressions: true,
  renameGlobals: false,
  selfDefending: true,
  simplify: true,
  splitStrings: true,
  splitStringsChunkLength: 10,
  stringArray: true,
  stringArrayCallsTransform: true,
  stringArrayCallsTransformThreshold: 0.75,
  stringArrayEncoding: ['base64'],
  stringArrayIndexShift: true,
  stringArrayRotate: true,
  stringArrayShuffle: true,
  stringArrayWrappersCount: 2,
  stringArrayWrappersChainedCalls: true,
  stringArrayWrappersParametersMaxCount: 4,
  stringArrayWrappersType: 'function',
  stringArrayThreshold: 0.75,
  transformObjectKeys: true,
  unicodeEscapeSequence: false
};

// Less aggressive obfuscation for better compatibility
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

function cleanDirectory(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  fs.mkdirSync(dir, { recursive: true });
}

function copyDirectory(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function obfuscateFile(srcPath, destPath, useLight = false) {
  console.log(`Obfuscating: ${path.basename(srcPath)}`);
  const code = fs.readFileSync(srcPath, 'utf8');

  const options = useLight ? lightObfuscationOptions : obfuscationOptions;
  const obfuscatedCode = JavaScriptObfuscator.obfuscate(code, options).getObfuscatedCode();

  fs.writeFileSync(destPath, obfuscatedCode, 'utf8');
}

function obfuscateDirectory(srcDir, destDir, useLight = false) {
  fs.mkdirSync(destDir, { recursive: true });
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

function createChromeManifest() {
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'manifests/manifest-chrome.json'), 'utf8'));

  // Remove Firefox-specific settings
  delete manifest.browser_specific_settings;

  // Ensure Chrome-specific settings
  manifest.manifest_version = 3;

  return manifest;
}

async function build() {
  console.log('🚀 Building Chrome extension with code obfuscation...\n');

  // Clean and create build directory
  console.log('📁 Cleaning build directory...');
  cleanDirectory(BUILD_DIR);

  // Copy static assets
  console.log('📋 Copying assets...');
  copyDirectory(path.join(ROOT_DIR, 'extension/assets'), path.join(BUILD_DIR, 'assets'));
  copyDirectory(path.join(ROOT_DIR, 'extension/public'), path.join(BUILD_DIR, 'public'));

  // Copy HTML and CSS (not obfuscated)
  console.log('📄 Copying HTML and CSS files...');
  fs.copyFileSync(path.join(ROOT_DIR, 'extension/popup.html'), path.join(BUILD_DIR, 'popup.html'));
  fs.copyFileSync(path.join(ROOT_DIR, 'extension/popup.css'), path.join(BUILD_DIR, 'popup.css'));

  // Obfuscate popup.js with light obfuscation (better compatibility)
  console.log('🔒 Obfuscating popup.js...');
  obfuscateFile(path.join(ROOT_DIR, 'extension/popup.js'), path.join(BUILD_DIR, 'popup.js'), true);

  // Copy background.js without obfuscation (required for script injection to work)
  console.log('📄 Copying background.js (no obfuscation for injection compatibility)...');
  fs.copyFileSync(path.join(ROOT_DIR, 'extension/background.js'), path.join(BUILD_DIR, 'background.js'));

  // Obfuscate src directory with full obfuscation
  console.log('🔒 Obfuscating source files...');
  obfuscateDirectory(path.join(ROOT_DIR, 'src'), path.join(BUILD_DIR, 'src'), false);

  // Create Chrome-compatible manifest
  console.log('📝 Creating Chrome manifest...');
  const chromeManifest = createChromeManifest();
  fs.writeFileSync(
    path.join(BUILD_DIR, 'manifest.json'),
    JSON.stringify(chromeManifest, null, 2)
  );

  console.log('\n✅ Chrome build completed successfully!');
  console.log(`📦 Build output: ${BUILD_DIR}`);
  console.log('\n📌 Next steps:');
  console.log('   1. Test the extension: Load unpacked from build-chrome/');
  console.log('   2. Create ZIP: npm run chrome:package');
  console.log('   3. Upload to Chrome Web Store');
  console.log('\n⚠️  Note: Always test the obfuscated build thoroughly before publishing!');
}

build().catch(console.error);

