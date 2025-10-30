import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..', '..');

console.log('🦊 Firefox Extension Signing\n');

// Load .env file if it exists
const envPath = path.join(ROOT_DIR, '.env');
if (fs.existsSync(envPath)) {
  console.log('📂 Loading credentials from .env...');
  const envContent = fs.readFileSync(envPath, 'utf8');

  // Parse .env file
  envContent.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#') && line.includes('=')) {
      const match = line.match(/export\s+([^=]+)="?([^"]+)"?/);
      if (match) {
        const [, key, value] = match;
        process.env[key] = value.replace(/["']/g, '');
      }
    }
  });
} else {
  console.log('⚠️  Warning: .env file not found\n');
  console.log('Create one with:');
  console.log('  cat > .env << \'EOF\'');
  console.log('  export WEB_EXT_API_KEY="your-jwt-issuer"');
  console.log('  export WEB_EXT_API_SECRET="your-jwt-secret"');
  console.log('  EOF\n');
}

// Check if credentials are set
const apiKey = process.env.WEB_EXT_API_KEY;
const apiSecret = process.env.WEB_EXT_API_SECRET;

if (!apiKey || !apiSecret) {
  console.error('❌ API credentials not set!\n');
  console.error('Please set environment variables:');
  console.error('  export WEB_EXT_API_KEY="your-jwt-issuer"');
  console.error('  export WEB_EXT_API_SECRET="your-jwt-secret"\n');
  process.exit(1);
}

console.log('✅ Credentials loaded\n');

// Build first
console.log('📦 Building Firefox extension...');
try {
  execSync('npm run build:firefox', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Build failed!');
  process.exit(1);
}

// Sign extension
console.log('\n🔐 Signing extension...');
try {
  const signCmd = `npx web-ext sign --source-dir=./build-firefox --artifacts-dir=./dist --api-key="${apiKey}" --api-secret="${apiSecret}" --channel=unlisted`;
  execSync(signCmd, { stdio: 'inherit' });

  console.log('\n✅ Signing complete!');
  console.log('📦 Check dist/ folder for your signed .xpi file');
} catch (error) {
  console.error('\n❌ Signing failed!');
  console.error('Please check your API credentials and try again.');
  process.exit(1);
}

