import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import archiver from 'archiver';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..', '..');

const BUILD_DIR = path.join(ROOT_DIR, 'build-chrome');
const DIST_DIR = path.join(ROOT_DIR, 'dist');

async function createZip() {
  // Ensure dist directory exists
  if (!fs.existsSync(DIST_DIR)) {
    fs.mkdirSync(DIST_DIR, { recursive: true });
  }

  // Get version from manifest
  const manifest = JSON.parse(fs.readFileSync(path.join(BUILD_DIR, 'manifest.json'), 'utf8'));
  const version = manifest.version;
  const outputPath = path.join(DIST_DIR, `cursor-card-helper-chrome-${version}.zip`);

  // Create write stream
  const output = fs.createWriteStream(outputPath);
  const archive = archiver('zip', {
    zlib: { level: 9 } // Maximum compression
  });

  return new Promise((resolve, reject) => {
    output.on('close', () => {
      console.log('\n✅ Package created successfully!');
      console.log(`📦 File: ${outputPath}`);
      console.log(`📊 Size: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`);
      resolve(outputPath);
    });

    archive.on('error', (err) => {
      reject(err);
    });

    archive.pipe(output);

    // Add all files from build directory
    archive.directory(BUILD_DIR, false);

    archive.finalize();
  });
}

console.log('📦 Packaging Chrome extension...\n');
createZip()
  .then((zipPath) => {
    console.log('\n🎉 Ready to upload to Chrome Web Store!');
    console.log('\n📋 Upload instructions:');
    console.log('   1. Go to: https://chrome.google.com/webstore/devconsole');
    console.log('   2. Click \'New Item\' or update existing extension');
    console.log(`   3. Upload: ${path.basename(zipPath)}`);
    console.log('   4. Fill in store listing details');
    console.log('   5. Submit for review');
  })
  .catch((err) => {
    console.error('❌ Error creating package:', err);
    process.exit(1);
  });

